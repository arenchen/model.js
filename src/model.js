/*jshint esversion: 6 */
/*jshint sub: true */

class Model {
  constructor(element, options) {
    this._options = this._merge(Model.Defaults, options);
    this._element = element;
    this._cacheElement = element.cloneNode(true);
    this._observer = new MutationObserver(function (mutations) {
      for (var mutation of mutations) {
        // console.log('observer', mutation.type, mutation);

        let elem, data = mutation.target.textContent || mutation.target.data;

        switch (mutation.type) {
          case 'characterData':
            elem = mutation.target.parentElement;
            break;
          case 'childList':
            elem = mutation.target;
            break;
          default:
            break;
        }

        if (elem == null || elem.modelId === undefined) continue;

        let id = elem.modelId;

        if (id.length == 1) {
          if (elem.dataSource[id[0]] != data) {
            elem.dataSource[id[0]] = data;
          }
        } else {
          if (elem.dataSource[id[0]][id[1]] != data) {
            elem.dataSource[id[0]][id[1]] = data;
          }
        }
      }
    });

    this._options.model = this._setModelHandler(options.model);
    this._initialize();
  }

  _initialize() {
    let elem = this._element.querySelector(this._filter);

    while (elem) {
      this._binding(elem, this._options.model);

      elem = this._element.querySelector(this._filter);
    }

    this._element.model = this;
  }

  _setModelHandler(model) {
    const _self = this;

    if (typeof model === 'object') {
      model = new Proxy(model, {
        get: function (target, property) {
          // console.log('get', target, property);
          return target[property];
        },
        set: function (target, property, value, receiver) {
          if (target[property] == value) return true;

          // console.log('set', target, property, value, receiver);

          target[property] = value;

          if (target.hasOwnProperty('elements')) {
            const elements = target['elements'];

            for (const elem of elements) {
              if (!_self._hasModelAttribute(elem, property)) continue;

              if (elem.hasOwnProperty('modelId')) {
                if (elem.value !== undefined) {
                  if (elem.value != value) {
                    elem.value = value;
                  }
                } else {
                  elem.innerText = value;
                }
              }
              if (elem.hasOwnProperty('modelCheckedId')) {
                if (elem.checked !== undefined && elem.checked != value) {
                  elem.checked = value;
                }
              }
              if (elem.hasOwnProperty('modelTextId')) {
                if (elem.text !== undefined && elem.text != value) {
                  elem.text = value;
                } else {
                  if (elem.innerText != value) elem.innerText = value;
                }
              }
            }
          }

          return true;
        }
      });

      for (const key in model) {
        if (key == 'elements') continue;
        if (typeof model[key] === 'object') {
          model[key] = _self._setModelHandler(model[key]);
        }
      }
    }

    return model;
  }

  _binding(srcElem, model, rownumber) {
    const _self = this;

    let result, value;

    rownumber = rownumber || 1;

    if (!_self._hasAttribute(srcElem)) return;

    if (model == null || model === undefined) {
      _self._removeAttribute(srcElem);
      return;
    }

    if (srcElem.hasAttribute(Model.DataSetMap.modelFor)) {
      const regex = /(\w+) in ([a-zA-Z0-9.]+)/ig;
      const matchModelFor = regex.exec(srcElem.dataset.modelFor);

      if (matchModelFor.length != 3) {
        _self._removeAttribute(srcElem);
        return;
      }

      if (matchModelFor[2].indexOf('.') == -1) {
        result = _self._getModelValue(matchModelFor[2], _self._options.model, matchModelFor[1]);
      } else {
        result = _self._getModelValue(matchModelFor[2], model, matchModelFor[1]);
      }

      if (result === undefined) {
        _self._removeAttribute(srcElem);
        return;
      }

      if (result.value == null) result.value = [];

      _self._cloneChild(srcElem, result.value.length);

      for (let i = 0; i < result.value.length; i++) {
        if (_self._hasAttribute(srcElem.children[i])) {
          _self._binding(srcElem.children[i], result.value[i], i + 1);
        }

        let element = srcElem.children[i].querySelector(_self._filter);
        while (element) {
          _self._binding(element, result.value[i], i + 1);
          element = srcElem.children[i].querySelector(_self._filter);
        }
      }
    }

    if (!model.hasOwnProperty('elements')) model['elements'] = [];

    model['elements'].push(srcElem);

    if (!srcElem.hasOwnProperty('dataSource')) srcElem.dataSource = model;

    if (srcElem.hasAttribute(Model.DataSetMap.model)) {
      result = _self._getModelValue(srcElem.dataset.model, model, null, rownumber);

      value = _self._eval(srcElem.dataset.model);

      if (result !== undefined) {
        value = (typeof result.value === 'function') ? result.value.call() : result.value;
        srcElem.modelId = result.id;
        srcElem.defaultValue = value;
      }

      if (srcElem.value !== undefined) {
        srcElem.value = value;

        const vGetValue = srcElem.__lookupGetter__('value');
        const vSetValue = srcElem.__lookupSetter__('value');

        Object.defineProperty(srcElem, 'vvalue', {
          get: vGetValue,
          set: vSetValue
        });

        Object.defineProperty(srcElem, 'value', {
          get: function () {
            return srcElem.vvalue;
          },
          set: function (value) {
            srcElem.vvalue = value;
            srcElem.dispatchEvent(new Event('change'));
          }
        });

        if (result.id.length == 1) {
          srcElem.addEventListener('change', function () {
            srcElem.dataSource[result.id[0]] = srcElem.value;
          }, false);
        } else {
          srcElem.addEventListener('change', function () {
            srcElem.dataSource[result.id[0]][result.id[1]] = srcElem.value;
          }, false);
        }
      } else {
        srcElem.innerText = value;
      }
    }

    if (srcElem.hasAttribute(Model.DataSetMap.modelChecked)) {
      result = _self._getModelValue(srcElem.dataset.modelChecked, model, null, rownumber);

      value = _self._eval(srcElem.dataset.modelChecked);

      if (result !== undefined) {
        value = (typeof result.value === 'function') ? result.value.call() : result.value;
        srcElem.modelCheckedId = result.id;
        srcElem.defaultChecked = value;
      }

      if (result.id.length == 1) {
        srcElem.addEventListener('change', function () {
          srcElem.dataSource[result.id[0]] = srcElem.checked;
        }, false);
      } else {
        srcElem.addEventListener('change', function () {
          srcElem.dataSource[result.id[0]][result.id[1]] = srcElem.checked;
        }, false);
      }

      if (srcElem.checked !== undefined) {
        srcElem.checked = value;
      }

      if (srcElem.selected !== undefined) {
        srcElem.selected = value;
      }
    }

    if (srcElem.hasAttribute(Model.DataSetMap.modelText)) {
      result = _self._getModelValue(srcElem.dataset.modelText, model, null, rownumber);

      value = _self._eval(srcElem.dataset.modelText);

      if (result !== undefined) {
        value = (typeof result.value === 'function') ? result.value.call() : result.value;
        srcElem.modelTextId = result.id;
        srcElem.defaultText = value;
      }

      if (srcElem.text !== undefined) {
        srcElem.text = value;
      } else {
        srcElem.innerText = value;
      }
    }

    _self._removeAttribute(srcElem);

    const config = _self._merge({}, Model.ObserverConfig);

    _self._observer.observe(srcElem, config);
  }

  _eval(str) {
    let result;

    try {
      const e = eval;
      result = e(str);
    } catch (err) {
      result = str;
    }

    return result;
  }

  _merge(obj1, obj2) {
    return Object.assign(obj1, obj2);
  }

  _mergeUpdateModel(model, destModel) {
    const _self = this;

    if (typeof model === 'object') {
      for (const key in model) {
        if (key == 'elements') continue;

        if (typeof model[key] === 'object') {
          destModel[key] = _self._mergeUpdateModel(model[key], destModel[key]);
        } else {
          destModel[key] = model[key];
        }
      }
    }

    return model;
  }

  _removeAttribute(elem) {
    for (let attr in Model.DataSetMap) {
      if (elem.hasAttribute(Model.DataSetMap[attr])) {
        elem[attr] = elem.getAttribute(Model.DataSetMap[attr]);
        elem.removeAttribute(Model.DataSetMap[attr]);
      }
    }
  }

  _getAttributes() {
    let result = [];

    for (let attr in Model.DataSetMap) {
      result.push(Model.DataSetMap[attr]);
    }

    return result;
  }

  _hasAttribute(elem) {
    let result = false;

    if (elem === undefined) return false;

    for (let attr in Model.DataSetMap) {
      result = elem.hasAttribute(Model.DataSetMap[attr]);

      if (result) return result;
    }

    return result;
  }

  _hasModelAttribute(elem, key) {
    let result = false;

    if (elem === undefined) return false;

    if (elem.hasOwnProperty('modelId')) {
      if (elem.modelId.slice(-1) == key) return true;
    }
    if (elem.hasOwnProperty('modelCheckedId')) {
      if (elem.modelCheckedId.slice(-1) == key) return true;
    }
    if (elem.hasOwnProperty('modelTextId')) {
      if (elem.modelTextId.slice(-1) == key) return true;
    }
    if (elem.hasOwnProperty('modelIf')) {

    }

    return result;
  }

  _cloneChild(elem, count) {
    const templates = elem.children;

    const tempContainer = document.createElement('DIV');

    for (let i = 0; i < count; i++) {
      for (const tmp of templates) {
        const cn = tmp.cloneNode(true);

        tempContainer.appendChild(cn);
      }
    }

    elem.innerHTML = tempContainer.innerHTML;
  }

  _getModelValue(key, model, item, rownumber) {
    rownumber = rownumber || 1;

    if (key == 'rownumber') return {
      id: ['rownumber'],
      value: rownumber
    };

    if (typeof this._eval(key) === 'object') return;

    const keys = key.split('.');

    if (!model.hasOwnProperty(keys[0])) {
      model[keys[0]] = null;
      return {
        id: keys,
        value: null
      };
    }

    let result = model[keys[0]];

    for (let i = 1; i < keys.length; i++) {
      result = result[keys[i]];
    }

    if (item != undefined) {
      let _mapModel = {};

      _mapModel[key] = [];

      for (let j in result) {
        const length = _mapModel[key].push(JSON.parse('{"' + item + '": null}'));
        _mapModel[key][length - 1][item] = result[j];
      }

      return {
        id: [item].concat(keys.slice(-1)),
        value: _mapModel[key]
      };
    }

    return {
      id: keys.slice(-2),
      value: result
    };
  }

  _isEmpty(obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }
    return true;
  }

  get _filter() {
    let result = '';
    for (let i in Model.DataSetMap) {
      result += '[' + Model.DataSetMap[i] + '],';
    }

    return result.substring(0, result.length - 1);
  }

  get Model() {
    return this._options.model;
  }

  set Model(value) {
    // this._mergeUpdateModel(value, this._options.model);
    const parent = this._element.parentNode;
    const cacheElement = this._cacheElement.cloneNode(true);
    parent.replaceChild(cacheElement, this._element);
    this._element = cacheElement;
    this._options.model = this._setModelHandler(value);
    this._initialize();
  }

  get UnbindingModel() {
    return JSON.parse(JSON.stringify(this._options.model, (key, value) => {
      if (key == 'elements') return;
      return value;
    }));
  }
}

Model.Defaults = {
  data: {},
  change: function (i, d) {}
};

Model.DataSetMap = {
  model: "data-model",
  modelChecked: "data-model-checked",
  modelFor: "data-model-for",
  modelIf: "data-model-if",
  modelText: "data-model-text"
};

Model.ObserverConfig = {
  // attributeFilter:       [],
  attributeOldValue: true,
  attributes: true,
  characterData: true,
  characterDataOldValue: true,
  childList: true,
  subtree: true
};