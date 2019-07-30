// (function() {
    'use strict';

    //---- two way data binding (to UI)

    //---- Components
    //-------------------------------------------------------------------//

    const settingComponent = Vue.extend({
        data: function() {
            return {
                upload_file:'',
                textarea_text:'',
                question_num: 6
            }
        },
        props: {
            // textarea_text:''
            questions:[]
        },
        template: '#setting_component',
        methods: {
            updateValue: function(e){
                // this.textarea_text = reader.result;
                this.$emit("input", e.target.value);
            },
            handleFileUpload: function(e){
                let files = e.target.files;
                this.upload_file = files[0];
                let reader = new FileReader();
                reader.readAsText(this.upload_file);
                reader.addEventListener('load', function() {
                    // this.textarea_text = reader.result;
                    localStorage.setItem('questions', reader.result);
                    console.log(JSON.parse(reader.result));
                    // $('#close_modal_btn').click();
                });
            },
            submit: function() {
                alert('submit');
                this.question_num = 6;
                let new_values ={
                    question_num: this.question_num
                }
                this.$emit('change', new_values);
                $('#close_modal_btn').click();
                // // FormData を利用して File を POST する
                // let formData = new FormData();
                // formData.append('yourFileKey', this.upload_file);
                // let config = {
                //     headers: {
                //         'content-type': 'multipart/form-data'
                //     }
                // };
                // axios
                //     .post('yourUploadUrl', formData, config)
                //     .then(function(response) {
                //         // response 処理
                //     })
                //     .catch(function(error) {
                //         // error 処理
                //     })
            },
        }
    });

    const likeComponent = Vue.extend({
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

    const playerComponent = Vue.extend({
        template: '#player_component',
        data: function() {
            return {
                index: null
            }
        },
        props: {
            index: null,
            lang:{
              type: String,
              default: ''
            },
            is_turn: {
                type: String,
                default: false
            },
            score:{
                type: Number
            }
        },
        methods: {
            clickBtn: function() {
                this.$emit('clicked');
            }
        }
    });

    const stageBtnComponent = Vue.extend({
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


    const wordComponent = Vue.extend({
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


    const cardComponent = Vue.extend({
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
            serial:{
                default: 0
            },
            stage_level:{
                default: 0
            },
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
            lang:{
              type: String,
              default: ''
            },
            is_open:{
                default: false
            },
            is_done:{
                default: false
            },
            is_active:{
                default: false
            },
            is_selected:{
                default: false
            },
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

    const vm = new Vue({
        el: '#app',
        components: {
            'like_component': likeComponent,
            'ward_component': wordComponent,
            'stage_btn_component': stageBtnComponent,
            'card_component': cardComponent,
            'setting_component': settingComponent,
            'player_component': playerComponent,
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
            sound_vol: 1,
            speech_apis:[],

            cards: [],
            players:[{
                lang:'ja',
                score: 0,
                is_turn: true,
            },
            {
                lang:'fi',
                score: 0,
                is_turn: false
            }],
            // question_sets:['ja','fi','de'],
            question_sets:['ja','en','fr'],
            questions: [],
            card_src_num: 6,

        },
        //データから動的にプロパティ値を計算してくれる算出プロパティ
        computed:{
            completed_cards: function() {
                let items = this.cards.filter(function(card) {
                    return card.is_done;
                });
                return items;
            },
            flipped_cards: function(){
                let items =[];
                if(this.stage_level == 0 || this.stage_level == 1){
                    items = this.cards.filter(function(card) {
                      return card.is_selected;
                    });
                }else{
                    items = this.cards.filter(function(card) {
                      return card.is_open && !card.is_done;
                    });
                }
                return items;
            },
            bingo_cards: function(){
                let items = this.cards.filter(function(card) {
                    return card.is_bingo;
                });
                return items;
            },
            activated_cards: function(){
                let items =[];
                if(this.flipped_cards.length > 0){
                    // if(this.stage_level == 0 || this.stage_level == 4){
                    if(this.stage_level == 4){
                        //---- the case with existing of selected card
                        let selected_serial = this.flipped_cards[0].serial;
                        //---- only selectable the cards with same meaning
                        items = this.cards.filter(function(card){
                          return card.serial == selected_serial && !card.is_done;
                        });
                    }else if(this.stage_level == 1 || this.stage_level == 2){
                        let selected_langs = [];
                        for(let i=0; i < this.flipped_cards.length; i++){
                            selected_langs.push(this.flipped_cards[i].lang);
                        };
                        //---- only selectable the cards in other languages
                        items = this.cards.filter(function(card){
                          return !selected_langs.includes(card.lang) && !card.is_done;
                        });
                    }else{
                        items = this.cards.filter(function(card){
                          return !card.is_done;
                        });
                    }
                }else{
                    items = this.cards.filter(function(card){
                      return !card.is_done;
                    });
                }
                return items;
            },
            is_success: function(){
                let answer = this.flipped_cards[0].serial;
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
            },
            current_player: function(){
                let players = this.players.filter(function(player,index) {
                    return (player.is_turn == true);
                });
                return players[0];
            },
            waiting_player: function(){
                let players = this.players.filter(function(player,index) {
                    return (player.is_turn == false);
                });
                return players[0];
            }
        },
        // Vue.js のインスタンスにはライフサイクルが定義されている
        //mounted : アプリがページにマウントされるタイミングでデータを読み込む
        mounted: function(){
            //---- create voice api object
            for(let i=0; i < this.question_sets.length; i++){
                const speech = new SpeechSynthesisUtterance();
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
                    localStorage.setItem('questions', JSON.stringify(this.questions));
                },
                deep: true
            },
            players:{
                handler: function () {
                  console.log('players changed')
                },
                deep: true
            }
        },
        methods: {
            changeSetting: function(_new_values){
                this.card_src_num = _new_values.question_num;
                this.initStage();
            },
            initStage: function(){
                //--- init timer
                this.is_timer_running = false;
                this.game_time = 0;
                clearTimeout(this.game_timer_id);
                this.cards = [];
                let cnt = 0; //---- for create serial number

                //---- set players

                //---- LOAD JSON
                // axios.get("./data/test.json").then(response => (this.items = response))

                this.questions = JSON.parse(localStorage.getItem('questions')) || [];
                this.questions = this.shuffle(this.questions);
                this.card_srcs = this.questions.slice(0,this.card_src_num);

                for(let i=0; i < this.card_srcs.length; i++){
                    console.log(i);
                    this.card_srcs[i].serial = cnt;
                    for(let j=0; j < this.question_sets.length; j++){
                          this.card_srcs[i].back = this.card_srcs[i].words[this.question_sets[j]];
                          this.card_srcs[i].lang = this.question_sets[j];
                          this.card_srcs[i].is_open = false;
                          this.card_srcs[i].is_done = false;
                          this.card_srcs[i].is_active = true;
                          this.card_srcs[i].is_selected = false;
                          this.customizeCard(i);

                          this.cards.push(JSON.parse(JSON.stringify(this.card_srcs[i])));
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
                let returns =[];
                while(_arr.length) {
                    let num = Math.floor(Math.random() * (_arr.length - 1));
                    let val = _arr.splice(num,1);
                    returns.push(val[0]);
                }
                return returns;
            },
            addItem: function() {
                let item = {
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
                if(this.sound_vol){
                    this.speekUp(_card.back[0], _card.lang);
                }
                if(_card.is_active == false){
                    return;
                }
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
                if(this.stage_level==0 || this.stage_level==1){
                    this.checkCards();
                }
            },
            activateCards: function(){
                this.cards.forEach(function(_card){
                    _card.is_active = false;
                });
                this.activated_cards.forEach(function(_card){
                    _card.is_active = true;
                });
            },
            speekUp: function(_word,_lang){
                let lang_num = this.question_sets.indexOf(_lang);
                let speech = this.speech_apis[lang_num];
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
                this.activateCards();
            },
            togglePlayer: function(){
                this.players = this.players.map(function(player,index) {
                    player.is_turn = !player.is_turn;
                    return player;
                });
            },
            failTrial:function(){
                this.flipped_cards.forEach(function(card){
                    if(vm.stage_level != 0 && vm.stage_level != 1){
                        card.is_open = false;
                    }
                    card.is_selected = false;
                    card.is_done = false;
                });
                this.togglePlayer();
                this.activateCards();
            },
            checkCards: function(){
                if(this.stage_level==0){
                    return;
                }
                this.activateCards();
                if(this.flipped_cards.length <= 1){
                    return;
                };
                if(this.is_success){
                    console.log('Success');

                    this.flipped_cards.forEach(function(card, index){
                        card.is_bingo = true;
                    });

                    if(this.flipped_cards[this.flipped_cards.length-1].lang !== this.waiting_player.lang){
                        // ---- give point 2
                        this.current_player.score = this.current_player.score + 2;
                    }else{
                        // ---- give point 4
                        this.current_player.score = this.current_player.score + 4;
                    }

                    if(this.flipped_cards.length === vm.question_sets.length){
                        vm.nextTrial();
                    }
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

// })();
