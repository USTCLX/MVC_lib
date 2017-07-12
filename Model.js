//短短的库，却蕴含大大的能量啊

var Model = {
	created:function(attrs){
		this.records ={};
		if(attrs){
			for(var key in attrs){
				this[key] = attrs[key];
			}
		}
	},
	prototype:{
		init:function(){
			// console.log(this);
		}
	},
	create:function(attrs){
		var klass = Object.create(this);
		klass.created(attrs);
		//如果直接使klass.prototype = this.prototype，那么在使用klass的include时，
		//就会重写Model的prototype,那么这些属性，就被会所有的klass共享
		klass.prototype = Object.create(this.prototype);
		return klass;
	},
	init:function(){
		var instance = Object.create(this.prototype);
		instance.parent = this;
		instance.init.apply(instance,arguments);
		return instance;
	},
	getAll:function(){

	}
	populate:function(values){
		var record,
			this.records = [];
		for(var i,il=values.length;i<il;i++){
			record = this.init(values[i]);
			this.recores.push(record);
		}
	},
	findById:function(id){
		return this.recores[id];
	},
	deleteById:function(id){
		delete this.records[id];
	},
	extend:function(obj){
		for(var key in  obj){
			this[key] = obj[key];
		}
	},
	include:function(obj){
		for(var key in obj){
			this.prototype[key] = obj[key];
		}
	}
}




