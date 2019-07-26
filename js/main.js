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
        props: {
            index: null
        },
        template: '<button @click="countUp">Like {{ count }}</button>',
        methods: {
                countUp: function() {
                this.count++;
                this.$emit('increment',this);
            }
        }
    });

    var stageBtnComponent = Vue.extend({
        data: function() {
            return {
                index: null
            }
        },
        props: {
            index: null,
            stage_name:{
              type: String,
              default: ''
            }
        },
        template: '<div class="stage_btn" @click="clickBtn()" > {{ index }} : {{ stage_name.toUpperCase() }} </div>',
        methods: {
            clickBtn: function() {
                this.$emit('clicked');
            }
        }
    });


    var wordComponent = Vue.extend({
        template: '#word_component',
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
        template: '#card_component',
        data: function() {
            return {
                count: 0,
                is_bingo: false,
                is_open: false,
                is_done: false,
                is_active: false,
                is_selected: false,
            }
        },
        props: {
            serial: null,
            stage_level: null,
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
            lang: 'gb',
            is_open: false,
            is_done: false,
            is_active: false,
            is_selected: false,
        },
        computed: {
            flag_name: function(){
              if(this.lang == 'en'){
                this.lang = 'gb';
              }else if(this.lang == 'ja'){
                this.lang = 'jp'
              }
              return 'flag-icon-' + this.lang;
            }
        },
        methods: {
            clickCard: function(){
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
            'like_component': likeComponent,
            'ward_component': wordComponent,
            'stage_btn_component': stageBtnComponent,
            'card_component': cardComponent
        },
        data: {
          title: 'my test',
          new_item: '',
          language: 'en',
          stage_level: 0,
          stages: ['preparation','open','close','close_random','anki'],

          start_time: null,
          game_time: 0,
          is_timer_running: false,
          timeout_id: 0,
          game_timer_id: null,

          is_debug: false,
          speech_apis:[],

          cards: [],
          question_sets:['ja','fi','de'],
          // question_sets:['ja','fi'],
          questions: [
                {
                    title: 'test1',
                    words: {
                        en: ['run'],
                        ja: ['はしる','走る','hashiru'],
                        de: ['rennen','renne','rennst','rennt'],
                        fi: ['juosta','juoksen','juokset','jouksi']
                    }
                },
                {
                    title: 'test2',
                    words: {
                        en: ['eat'],
                        ja: ['たべる','食べる','taberu'],
                        de:['essen','esse','isst','ißt/isst'],
                        fi: ['syödä','syön','syöt','syö']
                    }
                },
                {
                    title: 'test3',
                    words: {
                        en: ['sleep'],
                        ja: ['ねむる','眠る','nemuru'],
                        de: ['schlafen','schlafe','schläfst','schläft'],
                        fi: ['nukkua','nukun','nukut','nukkuu']
                    }
                },
                {
                    title: 'test4',
                    words: {
                        en: ['come'],
                        ja: ['くる','来る','kuru'],
                        de: ['kommen','komme','kommst','kommt'],
                        fi: ['tulla','tule','tulet','tulee']
                    }
                },
                {
                    title: 'test5',
                    words: {
                        en: ['say'],
                        ja: ['いう','言う','iu'],
                        de: ['sagen','sage','sagst','sagt'],
                        fi: ['sanoa','sanon','sanot','sanoo']
                    }
                },
                {
                    title: 'test6',
                    words: {
                        en: ['know'],
                        ja: ['しる','知る','shiru'],
                        de:['wissen','weiß','weißt','weiß'],
                        fi: ['tietää','tiedän','tiedät','tietää']
                    }
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
                if(this.stage_level == 1){
                  var items = this.cards.filter(function(card) {
                      return card.is_selected;
                  });
                }else{
                  var items = this.cards.filter(function(card) {
                      return card.is_open && !card.is_done;
                  });
                }
                return items;
            },
            bingo_cards: function(){
                var items = this.cards.filter(function(card) {
                    return card.is_bingo;
                });
                return items;
            },
            is_success: function(){
                var answer = this.flipped_cards[0].serial;
                return this.flipped_cards.every(function(card) {
                    return (card.serial === answer);
                });
            },
            is_game_completed: function(){
                if(this.completed_cards.length === this.cards.length) {
                    return true;
                }
                return false;
             },
             current_stage: function(){
               return this.stages[this.stage_level];
             }
        },
        // Vue.js のインスタンスにはライフサイクルが定義されている
        //mounted : アプリがページにマウントされるタイミングでデータを読み込む
        mounted: function(){
            //---- create voice api object
            for(var i=0; i < this.question_sets.length; i++){
                var speech = new SpeechSynthesisUtterance();
                speech.lang = `${this.question_sets[i]}-${this.question_sets[i].toUpperCase()}`;
                speech.rate = 0.8;
                this.speech_apis.push(speech);
            };
            this.initStage();
        },
        watch: {
            cards: {
                // watch: 指定したデータの変更を監視
                //---- watch:配列自体に変更があったとき処理実行
                //---- 配列の中身の要素、変更までは監視してくれない
                //---- 中身を監視するとき行う処理は handler で書いて、 deep オプションを true にする
                handler: function() {
                    // localStorage.setItem('questions', JSON.stringify(this.questions));
                    // this.initStage();
                },
                deep: true
            }
        },
        methods: {
            initStage: function(){

              this.is_timer_running = false;
              this.game_time = 0;
              clearTimeout(this.game_timer_id);

              this.cards = [];
              //---- create serial number
              var cnt = 0;

              // this.questions = JSON.parse(localStorage.getItem('questions')) || [];
              for(var i=0; i < this.questions.length; i++){
                  console.log(i);
                  this.questions[i].serial = cnt;
                  for(var j=0; j < this.question_sets.length; j++){
                      this.questions[i].back = this.questions[i].words[this.question_sets[j]];
                      this.questions[i].lang = this.question_sets[j];
                      this.questions[i].is_open = false;
                      this.questions[i].is_done = false;
                      this.questions[i].is_active = true;
                      this.questions[i].is_selected = false;
                      this.customizeCard(i);

                      this.cards.push(JSON.parse(JSON.stringify(this.questions[i])));
                  } ////---- for
                  cnt++;
              }; ////---- for
              // console.log(this.cards);
              // this.cards = this.shuffle(this.cards);
              this.customizeGame();
            },
            customizeCard: function(_q_index){
              switch (this.stage_level) {
                case 0:
                  console.log('List mode');
                  this.questions[_q_index].is_open = true;
                  break;
                case 1:
                  console.log('Open mode');
                  // this.questions[_q_index].front = this.questions[_q_index].back[0];
                  this.questions[_q_index].is_open = true;
                  break;
                case 2:
                  console.log('Memory mode');
                  break;
                case 3:
                  console.log('Random Memory mode');
                  this.questions[_q_index].front = '?';
                  break;
                case 4:
                  console.log('Anki mode');
                  break;
                default:

              }
            },
            customizeGame: function(){
              switch (this.stage_level) {
                case 0:
                  console.log('List mode');
                  break;
                case 1:
                  console.log('Open mode');
                  this.cards = this.shuffle(this.cards);
                  break;
                case 2:
                  console.log('Memory mode');
                  this.cards = this.shuffle(this.cards);
                  break;
                case 3:
                  console.log('Random Memory mode');
                  this.cards = this.shuffle(this.cards);
                  break;
                case 4:
                  console.log('Anki mode');
                  break;
                default:

              }
            },
            openStage: function(){
                this.initStage();
            },
            changeStage: function(_index){
                // this.current_stage = this.stages[_index];
                this.stage_level = _index;
                this.openStage();
            },
            openNextStage:function(){
                this.stage_level = this.stage_level+1;
                this.openStage();
            },
            finishStage: function(){
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

                if(_card.is_open === false){

                  _card.is_open = true;
                }

                _card.is_selected = true;
                this.speekUp(_card.back[0], _card.lang);
                if(this.stage_level==1){
                  this.checkCards();
                }
            },
            speekUp: function(_word,_lang){
                var lang_num = this.question_sets.indexOf(_lang);
                var speech = this.speech_apis[lang_num];
                speech.text = _word;
                speechSynthesis.speak(speech);
            },
            closeCards: function(){
                this.flipped_cards.forEach(function(card){
                    card.is_open = false;
                    card.is_selected = false;
                });
                this.resetTrial();
            },
            nextTrial: function(){
                this.flipped_cards.forEach(function(card){
                    card.is_selected = false;
                    card.is_done = true;
                });
                if(this.is_game_completed){
                    this.finishStage();
                    return;
                }
            },
            failTrial:function(){
                this.flipped_cards.forEach(function(card){
                    if(vm.stage_level != 1){
                        card.is_open = false;
                    }

                    card.is_selected = false;
                    card.is_done = false;
                });
            },
            checkCards: function(){
                if(this.flipped_cards.length <= 1){
                    return;
                };

                if(this.is_success){
                    console.log('Success');
                    this.flipped_cards.forEach(function(card,index){
                        card.is_bingo = true;
                        if(index === vm.question_sets.length-1){
                            vm.nextTrial();
                        };
                    });
                    //---- TODO: Show Picture
                    //---- TODO: sound Effect
                }else{
                    console.log('NG');
                    this.failTrial();
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
