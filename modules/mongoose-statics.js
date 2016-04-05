module.exports = {

        // CRUD FUNCTIONS
        
        _create: function(obj) {
            var self = this;
            return new Promise(function(resolve, reject){
                var doc = new self();
                for(var prop in obj) {
                    doc[prop] = obj[prop];
                }
                doc.save(function(error, result) {
                    if(error) reject(error);
                    resolve(result);
                });
            });
        },
        
        _read: function(query, fields, options) {
            var self = this;
            return new Promise(function(resolve, reject){
                self.find(query, fields, options, function(error, docs){
                    if(error) reject(error);
                    resolve(docs);
                });
            });
        },
        
        _update: function(conditions, update, options) {
            var self = this;
            return new Promise(function(resolve, reject){
                self.update(conditions, update, options, function(error, numAffected){
                    if(error) reject(error);
                    resolve(numAffected.n);
                });
            });
        },
        
        _delete: function(query) {
            var self = this;
            return new Promise(function(resolve, reject){
                self.remove(query, function(error, numAffected) {
                    if(error) reject(error);
                    resolve(numAffected.result.n);
                });    
            });
        },
        
        // ById CRUD functies
        
        _createById: function(id){
            return this._create({_id:id});
        },
        _readById: function(id){
            return this._read({_id:id});
        },
        _updateById: function(id){
            return this._update({_id:id});
        },
        _deleteById: function(id){
            return this._delete({_id:id});
        },
        
        // One CRUD functions
        
        _createOne: function(obj) {
            return this._create(obj);
        },
        _readOne: function(query, fields, options) {
            var self = this;
            return new Promise(function(resolve, reject){
                self.findOne(query, fields, options, function(error, doc){
                    if(error) reject(error);
                    resolve(doc);
                });
            });   
        },
        _updateOne: function(conditions, update, options) {
            return this._update(conditions, update, options);
        },
        _deleteOne: function(query) {
            return this._delete(query);
        },
        
        // Date functions
        
        // Sort functions

        _asc: function() {},
        _desc: function() {},
        _limit: function(query, fields, limit) {
            return this._read(query, fields, { limit: limit});
        },
        
        // Misc
        
        _search: function(string, property ) {
            var search = {},
                self = this;
                search[property] = new RegExp(string, 'i');
            return new Promise(function(resolve, reject){
                self.find(search, function(error, docs){
                    if(error) reject(error);
                    resolve(docs, docs.length); 
                });    
            });
        },
        
        _count: function() {
            var self = this;
            return new Promise(function(resolve, reject){
                self.find({}, function(error,docs){
                    if(error) reject(error);
                    resolve(docs.length);
                });
            });
        },

        _createRandomDoc: function() {
            
        },
        
        _createRandomDocs: function(number) {
            
        },
        
        
        $createRandom: function(fieldnames, number, cb){
            for(var i=0; i<number; i++) {
                var fields = {};
                fieldnames.forEach(function(name){
                    fields[name] = name + ' | ' + randomString(8);
                });
                this.$create(fields, function(error, doc){
                    if(error){cb(true)}
                    console.log(doc);
                });
            }
            cb(false);
        },
        
        $read: function(query, cb) {
            this.find(query, function(error, docs){
                if(error) cb(true, null, null);
                cb(false, docs, docs.length); 
            });
        },
        
        $readById: function(id, cb) {
            this.find({_id: id}, function(error, docs){
                if(error) cb(true, null, null);
                cb(false, docs, docs.length); 
            });  
        },
        
        $readOne: function(query, cb) {
            this.findOne(query, function(error, doc){
                if(error) cb(true, null);
                cb(false, doc);
            });
        },
        $readOneById: function(_id, cb) {
            this.findOne({_id:_id}, function(error, doc){
                if(error) cb(true, null);
                cb(false, doc);
            });
        },
        
        
        $updateById: function(_id, fields, cb) {
            this.update({_id:_id}, fields, function(error, doc){
                if(error) cb(true, null);
                cb(false, doc);
            });
        },
        $delete: function(query, cb) {
            this.remove(query, function(error) {
                if(error) cb(true);
                cb(false);
            });
        },
        $deleteById: function(_id, cb) {
            this.remove({_id:_id}, function(error) {
                if(error) cb(true);
                cb(false);
            });
        },
        $search: function(field, string, cb) {
            
        },
        $addToAll: function(object) {
            
        }
    };
    
function randomString(r){for(var n="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",a=0;r>a;a++)n+=t.charAt(Math.floor(Math.random()*t.length));return n};