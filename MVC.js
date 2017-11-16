/**
 * Created by lixiang on 2017/7/13.
 * Welcome!
 * This is a custom lightweight mvc lib learn from Spine based on Jquery.
 * I call it MVC or Mark_1 for short
 * It is good at small web applications
 */

/**
 * change log
 *
 * v0.0.1 2017/7/13
 *  base version
 * v0.0.2 2017/8/24
 *  add unbind method  in GlobelEvts
 *  add refreshPopulateState method in Model
 */

(function($,exports){
    /**
     * support for Object.create fun
     */
    if(typeof Object.create !=="function"){
        Object.create = function(o){
            function F(){}
            F.prototype = o;
            return new F();
        }
    }

    /**
     * guid generate
     * @returns {string}
     */
    Math.guid = function(){
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxx".replace(/[xy]/g,function (c) {
            var r = Math.random()*16|0,v=(c==='x')?r:(r&0x3|0x8);
            return v.toString(16);
        }).toUpperCase();
    };

    /**
     * Events machine use PubSub pattern
     * @type {{}}
     */
    var GlobelEvts ={
        bind:function(ev,cb){
            var calls = this._callbacks||(this._callbacks = {});
            (this._callbacks[ev]||(this._callbacks[ev] = [])).push(cb);
        },
        trigger:function (ev,data) {
            var list,calls,i,l;
            if(!(calls = this._callbacks))
                return this;
            if(!(list = this._callbacks[ev]))
                return this;
            $.each(list,function(){
                this(data);
            })
        },
        unbind:function(ev,cb){
            var calls = this._callbacks||(this._callbacks = {});
            var list;
            if(!calls[ev]){
                return this;
            }
            list = calls[ev];
            for(var i=0,il=list.length;i<il;i++){
                if(list[i]===cb){
                    list.splice(i,1);
                }
            }
            return this;
        }
    };

    var Model = {
        inherited:function(){},
        created:function(attributes){
            this.records = [];
            // this.attributes = [];
            this.alreadyGetData = false;
            if(attributes){
                for(var key in attributes){
                    this[key]  =  attributes[key];
                }
            }
        },

        prototype:{
            init:function(){}
        },

        create:function(attributes){
            var object = Object.create(this);
            object.parentClass = this;
            object.prototype = object.fn = Object.create(this.prototype);
            object.created(attributes);
            this.inherited(object);
            return object;
        },

        init:function () {
            var instance = Object.create(this.prototype);
            instance.parentClass = this;
            instance.init.apply(instance,arguments);
            return  instance;
        },

        extend:function (o) {
            var extended = o.extended;
            $.extend(this,o);
            if(extended) extended(this);
        },

        include:function (o) {
            var included = o.included;
            $.extend(this.prototype,o);
            if(included) included(this);
        }
    };

    Model.extend({
        findById:function (_id) {
            if(!!_id){
                for(var i=0,il=this.records.length;i<il;i++){
                    if(this.records[i]._id == _id){
                        var record = this.records[i];
                        return record.dup();
                    }
                }
            }
            // console.log('find nothing depend on id');
            return undefined;
        },
        searchByKeyWord:function(keyword){
            var tempRecords = [];
            for(var i=0,il=this.records.length;i<il;i++){
                if(this.records[i].name.indexOf(keyword)!==-1){
                    tempRecords.push(this.records[i].dup());
                }
            }
            return  tempRecords;
        },
        reverseRecords:function(){
            this.orderByTime = !this.orderByTime;
            this.records.reverse();
            return this.getAllRecords();
        },
        getAllRecords:function () {
            return $.extend(true,[],this.records);
        },
        deleteById:function (_id) {
            for(var i=0,il=this.records.length;i<il;i++){
                if(this.records[i]._id == _id){
                    this.records.splice(i,1);
                    break;
                }
            }
            this.trigger('delete:one');
        },
        populate:function(values){
            this.records = [];
            var record;
            for(var i=0,il=values.length;i<il;i++){
                record = this.init(values[i]);
                if(!record._id){
                    record._id = Math.guid();
                }
                record.newRecord = false;
                this.records.push(record);
            };
            this.alreadyGetData = true;
            this.trigger('populate:all');
        },
        refresh:function(values){
            this.records = [];
            var record;
            for(var i=0,il=values.length;i<il;i++){
                record = this.init(values[i]);
                if(!record._id){
                    record._id = Math.guid();
                }
                record.newRecord = false;
                this.records.push(record);
            }
            this.alreadyGetData = true;
            this.trigger('refresh:all',this.getAllRecordsAttrs());
        },
        getPopulateState:function(){
            return this.alreadyGetData;
        },
        refreshPopulateState:function(){
            this.alreadyGetData = false;
        },
        getAllRecordsAttrs:function(){
            var result = [];
            var records = this.records;
            for(var i=0,il=records.length;i<il;i++){
                result.push(records[i].attributes());
            }
            return result;
        },
        bind:function(ev,cb){
            var calls = this._callbacks||(this._callbacks = {});
            (this._callbacks[ev]||(this._callbacks[ev] = [])).push(cb);
        },
        trigger:function (ev,data) {
            var list,calls,i,l;
            if(!(calls = this._callbacks))
                return this;
            if(!(list = this._callbacks[ev]))
                return this;
            $.each(list,function(){
                this(data);
            })
        }
    });

    Model.include({
        newRecord:true,
        init:function(attrs){
            if(attrs){
                this.load(attrs);
            }
        },
        load:function(attributes){
            for(var name in attributes){
                this[name] = attributes[name];
            }
        },
        create:function () {
            if(!this._id){
                this._id = Math.guid();
            }
            this.newRecord = false;
            this.parentClass.records.unshift(this);
            this.parentClass.trigger('create:one',this.attributes());
        },
        destory:function(){
            var records = this.parentClass.records;
            for(var i=0,il=records.length;i<il;i++){
                if(records[i]._id===this._id){
                    records.splice(i,1);
                    this.parentClass.trigger('delete:one');
                    break;
                }
            }
        },
        update:function(){
            var records = this.parentClass.records;
            for(var i=0,il=records.length;i<il;i++){
                if(records[i]._id===this._id){
                    records[i] = this.dup();
                    this.parentClass.trigger('update:one',this.attributes());
                    break;
                }
            }
        },
        save:function(){
            this.newRecord?this.create():this.update();
        },
        dup:function(){
            return $.extend(true,{},this);
        },
        attributes:function () {
            var result = {};
            for(var key in this.parentClass.attributes){
                var attr = this.parentClass.attributes[key];
                result[attr] = this[attr];
            }
            result._id = this._id;
            return result
        },
        createRemote:function(url,scb,fcb){
            $.ajax({
                url:url,
                data:this.attributes(),
                success:scb,
                error:fcb,
                type:"POST"
            })
        },
        updateRemote:function(url,scb,fcb){
            $.ajax({
                url:url,
                data:this.attributes(),
                success:scb,
                error:fcb,
                type:"PUT"
            })
        }
    });

    var Controller = {
        create:function(includes){
            var result = function(){
                this.initializer.apply(this, arguments);
                this.init.apply(this, arguments);
            };

            result.fn = result.prototype;
            result.fn.init = function(){};

            result.proxy    = function(func){ return $.proxy(func, this); };
            result.fn.proxy = result.proxy;
            result.include = function(ob){ $.extend(this.fn, ob); };
            result.extend  = function(ob){ $.extend(this, ob); };

            result.include({
                initializer: function(options){
                    this.options = options;

                    for (var key in this.options)
                        this[key] = this.options[key];
                    if (this.events) this.delegateEvents();
                    if (this.elements) this.refreshElements();
                },

                $: function(selector){
                    return $(selector, this.el);
                },
                refreshElements: function(){
                    for (var key in this.elements) {
                        this[this.elements[key]] = this.$(key);
                    }
                },
                eventSplitter: /^(\w+)\s*(.*)$/,
                delegateEvents: function(){
                    for (var key in this.events) {
                        var methodName = this.events[key];
                        var method     = this.proxy(this[methodName]);
                        var match      = key.match(this.eventSplitter);
                        var eventName  = match[1], selector = match[2];
                        if (selector === '') {
                            this.el.bind(eventName, method);
                        } else {
                            this.el.delegate(selector, eventName, method);
                        }
                    }
                }
            });
            if (includes) result.include(includes);
            return result;
        }
    };


    var OtherEvents = {
        bind: function(){
            if ( !this.o ) this.o = $({});
            this.o.bind.apply(this.o, arguments);
        },

        trigger: function(){
            if ( !this.o ) this.o = $({});
            this.o.trigger.apply(this.o, arguments);
        }
    };
    var StateMachine = function(){};
    StateMachine.fn  = StateMachine.prototype;
    $.extend(StateMachine.fn, OtherEvents);

    StateMachine.fn.add = function(controller){
        this.bind("change", function(e,init,current){
            if (controller == current)
                controller.activate(init);
            else
                controller.deactivate();
        });

        controller.active = $.proxy(function(init){
            this.trigger("change", [!!init,controller]);
        }, this);
    };

    // name space
    var MVC = {
        version:'0.0.2',
        Model:Model,
        Controller:Controller,
        StateMachine:StateMachine,
        GlobelEvts:GlobelEvts
    };

    exports.MVC = MVC;

})(jQuery,window);
