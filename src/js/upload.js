define([
  'underscore',
  './emitter'
], function(_, Emitter) {
  'use strict';

  var Upload = function(options) {this.initialize(options)};

  // mixin emitter
  _.extend(Upload.prototype, Emitter.prototype);

  /**
  * @param {Object} options
  * Required options: sendPath, callback, file
  */
  Upload.prototype.initialize = function(options) {
    this.options = options;
    this.sendPath = options.sendPath;
    this.headers = options.headers || {};
  }

  Upload.prototype.sendFile = function(file, fields, callback) {
    var self = this;
    this.callback = callback;

    this.trigger('start', file);

    var req = this.req = new XMLHttpRequest();
    var method = this.options.method;
    req.open(method, this.sendPath, true);
    // set xhr headers if any
    _.map(this.headers, function(val, key) {
        req.setRequestHeader(key, val)
      });

    req.onload = this.onload.bind(this);
    req.onerror = this.onerror.bind(this);
    req.upload.onprogress = this.onprogress.bind(this);
    req.onreadystatechange = function() {
      if (req.readyState === 4) {
        self.onreadystatechange(req, callback);
      }
    };

    if(method === 'POST') {
      var body = new FormData;
      _.each(fields, function(val, key) {
        body.append(key, val);
      });
      body.append('file', file);
      req.send(body);
    } else {
      req.send(file);
    }
  }

  Upload.prototype.onreadystatechange = function(req) {
    if (req.status === 200) return this._notifyListeners(null, req)
    var err = new Error(req.statusText + ': ' + req.response);
    err.status = req.status;
    this._notifyListeners(err);
  };

  Upload.prototype.onerror = function(e){
    this.trigger('error', e);
  };

  Upload.prototype.onload = function(e){
    this.trigger('end', this.req);
  };

  Upload.prototype.onprogress = function(e){
    e.percent = Math.round(e.loaded / e.total * 100);
    this.trigger('progress', e);
  };

  Upload.prototype._notifyListeners = function(err, req) {
    if(typeof this.callback !== 'function') return;
    this.callback(err, req);
  };

  return Upload;
});