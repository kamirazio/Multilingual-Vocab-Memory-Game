(function() {
    'use strict';

    //---- two way data binding (to UI)

    //---- Components
    //-------------------------------------------------------------------//

    var likeComponent = Vue.extend({
     //---- Componentのdata は、関数で返しさなければならない
     data: function() {
            return {
                count: 0
            }
        },
        template: '<button @click="countUp">Like {{ count }}</button>',
        methods: {
                countUp: function() {
                this.count++;
                this.$emit('increment',this);
            }
        }
    });


    var wordComponent = Vue.extend({
        template: '#word-component',
        //---- カスタム属性
        props: {
            message: {
            type: String,
            default: 'Star'
            }
        },
        //---- Component から親要素に対してデータを渡す
        //---- Component からイベントを発火して、親要素の方でそれを検出
        methods: {
            checkStar: function() {
                alert(this.message);
            }
        }
    });


    var cardComponent = Vue.extend({
        template: '#card-component',
        data: function() {
            return {
                count: 0,
            }
        },
        props: {
            serial: null,
            answer:{
                type: String,
                default: ''
            },
            front:{
            type: String,
            default: ''
            },
            back:{
            type: String,
            default: ''
            },
            is_open: false,
            is_done: false,
        },
        // transitions: {
        //     'card': {
        //         enter(el) {
        //             console.log('enter');
        //         },
        //         leave(el, done) {
        //             console.log('enter');
        //         }
        //     }
        // },
        methods: {
            clickCard: function(){
                // this.is_open = true;
                if(this.is_open === true){
                    return;
                }
                // this.is_open = true;
                this.$emit('clicked');
            },
            cardFlipped: function(){
                this.$emit('flipped');
            },
            checkCardInfo: function(){
                //---- TODO: Pronounce
                //---- TODO: Show color
                console.log(this);
            }
        }
    });


    //---- Vue Object
    //-------------------------------------------------------------------//

    var vm = new Vue({
        el: '#app',
        components: {
            'like-component': likeComponent,
            'ward-component': wordComponent,
            'card-component': cardComponent
        },
        data: {
        title: 'My Cards',
        new_item: '',
        language: 'en',

        // is_game_completed: false,
        start_time: null,
        game_time: 0,
        is_timer_running: false,
        timeout_id: 0,
        game_timer_id: null,
        is_debug: true,
        speech_apis:[],

        cards: [],
        question_sets:['ja','fi'],
        questions: [
            {
                title: 'test1',
                front: '?',
                back: '',
                words: {
                    en: ['run'],
                    ja: ['はしる','走る','hashiru'],
                    de: ['rennen'],
                    fi: ['ajaa']
                },
                set: 0,
                is_open: false,
                is_done: false
            },
            {
                title: 'test2',
                front: '?',
                back: '',
                words: {
                    en: ['eat'],
                    ja: ['たべる','食べる','taberu'],
                    de:['essen'],
                    fi: ['syödä']
                },
                set: 0,
                is_open: false,
                is_done: false
            },
            {
                title: 'test3',
                front: '?',
                back: '',
                words: {
                    en: ['sleep'],
                    ja: ['ねむる','眠る','nemuru'],
                    de: ['schlafen'],
                    fi: ['nukkua']
                },
                set: 0,
                is_open: false,
                is_done: false
            },
            {
                title: 'test4',
                front: '?',
                back: '',
                words: {
                    en: ['come'],
                    ja: ['くる','来る','kuru'],
                    de: ['kommen'],
                    fi: ['tulla']
                },
                set: 0,
                is_open: false,
                is_done: false
            },
            ]
        },
        //データから動的にプロパティ値を計算してくれる算出プロパティ
        computed:{
            completed_cards: function() {
                var items = this.cards.filter(function(card) {
                    return card.is_done;
                });
                return items;
            },
            flipped_cards: function(){
                var items = this.cards.filter(function(card) {
                    return card.is_open && !card.is_done;
                });
                return items; 
            },
            is_game_completed: function(){
               if(this.completed_cards.length === this.cards.length) {
                   return true;
               }
               return false;
            },
            is_success: function(){
                var answer = this.flipped_cards[0].serial;
                return this.flipped_cards.every(function(card) {
                    return (card.serial === answer);
                });
            }
        },
        // Vue.js のインスタンスにはライフサイクルが定義されている
        //mounted : アプリがページにマウントされるタイミングでデータを読み込む
        mounted: function(){

            for(var i=0; i < this.question_sets.length; i++){
                var speech = new SpeechSynthesisUtterance();
                speech.lang = `${this.question_sets[i]}-${this.question_sets[i].toUpperCase()}`;
                speech.rate = 0.8;
                this.speech_apis.push(speech);
            };
                
            var cnt = 0;
            // this.questions = JSON.parse(localStorage.getItem('questions')) || [];
            for(var i=0; i < this.questions.length; i++){
                console.log(i);
                this.questions[i].serial = cnt;
                for(var j=0; j < this.question_sets.length; j++){
                    this.questions[i].back = this.questions[i].words[this.question_sets[j]];
                    this.questions[i].lang = this.question_sets[j];
                    console.log(this.questions[i].back);
                    this.cards.push(JSON.parse(JSON.stringify(this.questions[i])));
                }
                cnt++;
            }
            this.cards = this.shuffle(this.cards);
            console.log(this.cards);
        },
        watch: {
            cards: {
                // watch: 指定したデータの変更を監視
                //---- watch:配列自体に変更があったとき処理実行
                //---- 配列の中身の要素、変更までは監視してくれない
                //---- 中身を監視するとき行う処理は handler で書いて、 deep オプションを true にする
                handler: function() {
                    localStorage.setItem('questions', JSON.stringify(this.questions));
                },
                deep: true
            }
        },
        methods: {
            finishGame: function(){
                // alert('---FIN---');
                clearTimeout(this.game_timer_id);
                // this.is_game_completed = true;
            },
            shuffle: function(_arr){
                var returns =[];
                while(_arr.length) {
                    var num = Math.floor(Math.random() * (_arr.length - 1));
                    var val = _arr.splice(num,1);
                    returns.push(val[0]);
                }
                return returns;
            },
            addItem: function() {
                var item = {
                    title: this.new_item,
                    is_done: false
                };
                this.cards.push(item);
                this.new_item = '';
            },
            deleteItem: function(index) {
                if (confirm('are you sure?')) {
                    this.cards.splice(index, 1);
                }
            },
            // purge: function() {
            //     if (!confirm('delete finished?')) {
            //     return;
            //     }
            //     this.cards = this.remaining;
            // },
            flipCard: function(_card) {
                //---- Set Game timer
                if(this.is_timer_running === false){
                    this.is_timer_running = true;
                    this.start_time = Date.now();
                    this.runTimer();
                }

                _card.is_open = true;
                var lang_num = this.question_sets.indexOf(_card.lang);
                var speech = this.speech_apis[lang_num];
                speech.text = _card.back[0];
                speechSynthesis.speak(speech);
            },
            closeCards: function(){
                this.flipped_cards.forEach(function(card){
                    card.is_open = false;
                });
                this.resetTrial();
            },
            resetTrial: function(){
                
            },
            checkCards: function(){
                if(this.flipped_cards.length != this.question_sets.length){
                    return;
                };
                if(this.is_success){
                    //---- TODO: success action
                    console.log('Success');
                    this.flipped_cards.forEach(function(card){
                        card.is_done = true;
                    })
                    console.log(this.completed_cards);
                    
                    if(this.is_game_completed){
                        this.finishGame();
                        return;
                    }
                    //---- TODO: Show Picture
                    this.resetTrial();
                }else{
                    console.log('NG');
                    this.flipped_cards.forEach(function(card){
                        card.is_open = false;
                    });
                }
            },
            runTimer: function() {
                this.game_time = ((Date.now() - this.start_time) / 1000).toFixed(2);
                this.game_timer_id = setTimeout(function() {
                  vm.runTimer();
                }, 100);
            }
        },
        
    }); ////---- vue object

})();
