"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var symbol_observable_1 = require("symbol-observable");
;
/**
 * An infinte iteratable that is used to represent values over time
 */
var Signal = (function () {
    function Signal(source) {
        this.source = source;
        //+++++++++++++++ short-hand functions +++++++++++++++++++//
        this.constantAfter = constantAfter.bind(null, this);
        this.map = map.bind(null, this);
        this.fold = fold.bind(null, this);
        this.drop = drop.bind(null, this);
    }
    //+++++++++++++ iterator interface +++++++++++++++++++++//
    Signal.prototype[Symbol.iterator] = function () {
        return this;
    };
    Signal.prototype.next = function () {
        return this.source.next();
    };
    Signal.prototype.compose = function (transform) {
        return transform(this);
    };
    return Signal;
}());
exports.Signal = Signal;
var BaseSource = (function () {
    function BaseSource() {
    }
    BaseSource.prototype[symbol_observable_1.default] = function () {
        return this;
    };
    BaseSource.prototype.compose = function (fn) {
        return fn(this);
    };
    BaseSource.prototype.map = function (fn) {
        return this.compose(mapStream(fn));
    };
    BaseSource.prototype.fold = function (fn, seed) {
        return this.compose(foldStream(fn, seed));
    };
    BaseSource.prototype.sampleCombine = function () {
        var signals = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            signals[_i] = arguments[_i];
        }
        return this.compose(sampleCombine.apply(void 0, signals));
    };
    return BaseSource;
}());
exports.BaseSource = BaseSource;
var ArraySource = (function (_super) {
    __extends(ArraySource, _super);
    function ArraySource(array) {
        var _this = _super.call(this) || this;
        _this.array = array;
        return _this;
    }
    ArraySource.prototype.subscribe = function (observer) {
        this.array.forEach(function (t) { return observer.next(t); });
    };
    return ArraySource;
}(BaseSource));
exports.ArraySource = ArraySource;
var PromiseSource = (function (_super) {
    __extends(PromiseSource, _super);
    function PromiseSource(promise) {
        var _this = _super.call(this) || this;
        _this.promise = promise;
        return _this;
    }
    PromiseSource.prototype.subscribe = function (observer) {
        this.promise.then(function (t) {
            observer.next(t);
        });
    };
    return PromiseSource;
}(BaseSource));
exports.PromiseSource = PromiseSource;
var Stream = (function (_super) {
    __extends(Stream, _super);
    function Stream(_subscribe) {
        var _this = _super.call(this) || this;
        _this._subscribe = _subscribe;
        return _this;
    }
    Stream.prototype.subscribe = function (o) {
        this._subscribe(o);
    };
    return Stream;
}(BaseSource));
exports.Stream = Stream;
//++++++++++++++++++ streamOperators ++++++++++++++++++++++++++++//
function mapStream(fn) {
    return function (stream) { return new Stream(function (observer) {
        stream.subscribe({
            next: function (t) { return observer.next(fn(t)); },
            error: observer.error,
            complete: observer.complete
        });
    }); };
}
exports.mapStream = mapStream;
function foldStream(fn, seed) {
    return function (stream) { return new Stream(function (observer) {
        var accumulator = seed;
        stream.subscribe({
            next: function (t) {
                accumulator = fn(accumulator, t);
                observer.next(accumulator);
            },
            error: observer.error,
            complete: observer.complete
        });
    }); };
}
exports.foldStream = foldStream;
function sampleCombine() {
    var signals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        signals[_i] = arguments[_i];
    }
    return function (stream) { return new Stream(function (observer) {
        stream.subscribe({
            next: function (t) {
                var values = signals.map(function (s) { return s.next().value; });
                observer.next([t].concat(values));
            },
            error: observer.error,
            complete: observer.complete
        });
    }); };
}
exports.sampleCombine = sampleCombine;
//++++++++++++ creators ++++++++++++++++++++++++++++++//
function createSignal(iterator) {
    return new Signal(iterator);
}
exports.createSignal = createSignal;
function fromGetter(getter) {
    return createSignal({
        next: function () {
            return { value: getter(), done: false };
        }
    });
}
exports.fromGetter = fromGetter;
function constant(val) {
    return fromGetter(function () { return val; });
}
exports.constant = constant;
//+++++++++++++ transformers +++++++++++++++++++++++//
function constantAfter(signal, amount) {
    var currentIteration = 1;
    var result = undefined;
    return createSignal({
        next: function () {
            if (currentIteration < amount) {
                currentIteration++;
                return signal.next();
            }
            if (currentIteration === amount) {
                result = signal.next();
            }
            return result;
        }
    });
}
exports.constantAfter = constantAfter;
function map(signal, fn) {
    return createSignal({
        next: function () {
            return { value: fn(signal.next().value), done: false };
        }
    });
}
exports.map = map;
function fold(signal, fn, seed) {
    var accumulator = seed;
    return createSignal({
        next: function () {
            accumulator = fn(accumulator, signal.next().value);
            return { value: accumulator, done: false };
        }
    });
}
exports.fold = fold;
function drop(signal, amount) {
    var dropped = false;
    return createSignal({
        next: function () {
            if (!dropped) {
                for (var i = 0; i < amount; i++) {
                    signal.next();
                }
                dropped = true;
            }
            return signal.next();
        }
    });
}
exports.drop = drop;
//+++++++++++++ combinators +++++++++++++++++++++++//
function combine() {
    var signals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        signals[_i] = arguments[_i];
    }
    return createSignal({
        next: function () {
            var nextValues = signals.map(function (s) { return s.next().value; });
            return { value: nextValues, done: false };
        }
    });
}
exports.combine = combine;
//# sourceMappingURL=index.js.map