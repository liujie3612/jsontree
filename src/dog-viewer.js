URL.prototype._child = function(key) {
    var newUrl = this.toString();
    if (this.pathname == "/") {
        newUrl = newUrl + key;
    } else {
        newUrl = newUrl + "/" + key;
    }
    return new URL(newUrl);
}

URL.prototype._parent = function(key) {
    var newUrl = this.toString();
    if (this.pathname == "/") {
        return null;
    } else {
        var lastIndex = newUrl.lastIndexOf("/");
        newUrl = newUrl.substring(0, lastIndex);
        if (newUrl == "") {
            newUrl = "/"
        }
    }
    return new URL(newUrl);
}

var DomView = function(rootDom, showConfirmFunc) {
    this.rootDom = rootDom;
    this.prx = "" + Math.floor(Math.random() * 10000);
    this.showConfirmFunc = showConfirmFunc;
    this.globalEditing = false;
    this.init();
}

DomView.prototype.init = function() {
    this.rootDom.innerHTML =
        '<div class="jstree jstree-forcused jstree-default">' +
        '<ul></ul> ' +
        '</div>';
    this.rootDom = this.rootDom.querySelector("ul");
    this.hasRoot = false;
}

DomView.Templates = {
    leaf: '<li>' +
        '<div>' +
        '<ins class="jstree-icon">&nbsp;</ins>' +
        '<span class="tree-content">' +
        '<span><a class="name"></a>' +
        '<span class="valueContainer">:<input type="text"  class="valueedit valueedit-hover"  disabled="disabled">' +
        '</span>' +
        '<a href="#" class="spriteBtn addBtn">&nbsp;</a>' +
        '<a href="#" class="spriteBtn removeBtn">&nbsp;</a>' +
        '<span class="division">|</span>' +
        '<a href="#" class="spriteBtn importBtn"></a>' +
        '<a href="#" class="spriteBtn exportBtn"></a>' +
        '</span>' +
        '</span>' +
        '</div>' +
        '<ul>  ' +
        '</ul>' +
        '</li>',
    editor: '<li class="jstree-leaf adding">' +
        '<div>' +
        '<ins class="jstree-icon">&nbsp;</ins>' +
        '<span class="tree-content">' +
        '<span>' +
        '<span class="nameLabel">name:</span>' +
        '<input type="text" class="nameInput" placeholder="Name">' +
        '<span>' +
        '<span class="valueLabel">value:</span>' +
        '<input type="text" class="valueInput" placeholder="Value">' +
        '</span>' +
        '</span>' +
        '<a href="#" class="spriteBtn addBtn">&nbsp;</a>' +
        '<a href="#" class="spriteBtn removeBtn">&nbsp;</a>' +
        '</span>' +
        '</div>' +
        '<ul></ul>' +
        '</li>',
    confirm: '<li class="confirm">' +
        '<ins>&nbsp;</ins>' +
        '<a href="#" class="spriteBtn cancelBtn" id="cancelBtn"></a>' +
        '<a href="#" class="spriteBtn confirmBtn" id="confirmBtn"></a>' +
        '</li>'
}

DomView.prototype._getValueFromEditor = function(dom) {
    var name = dom.querySelector('.nameInput').value;
    if (typeof name != 'string' || name.length < 1) {
        return null
    }
    var ul = dom.querySelector('ul');
    var value = null;
    if (ul.hasChildNodes()) {
        value = {};
        var lis = ul.children;
        for (var i = 0; i < lis.length; i++) {
            var li = lis[i];
            var resi = this._getValueFromEditor(li);
            if (resi == null) {
                return null;
            }
            var keyi = resi.key;
            var valuei = resi.value;
            value[keyi] = valuei;
        }
    } else {
        value = dom.querySelector('.valueInput').value;
        try {
            value = JSON.parse(value);
        } catch (e) {
            //do nothing
        }
    }
    return { "key": name, "value": value };
}

DomView.prototype._newConfirm = function(confirmCallback, cancelCallback) {
    var self = this;
    var doc = new DOMParser().parseFromString(DomView.Templates.confirm, 'text/html');
    var res = doc.body.firstChild;
    res.querySelector('.confirmBtn').onclick = function(e) {
        e.preventDefault()
        confirmCallback();
    }
    res.querySelector('.cancelBtn').onclick = function(e) {
        e.preventDefault()
        cancelCallback();
    }
    return res;
}

DomView.prototype._newEditNode = function(rmCallback) {
    var self = this;
    var doc = new DOMParser().parseFromString(DomView.Templates.editor, 'text/html');
    var res = doc.body.firstChild;
    var ul = res.querySelector('ul');
    var valueSpan = res.querySelector('.valueLabel').parentNode;
    res.querySelector('.addBtn').onclick = function(e) {
        e.preventDefault()
        valueSpan.innerHTML = '';
        ul.appendChild(self._newEditNode(function(node) {
            ul.removeChild(node);
            if (!ul.hasChildNodes()) {
                valueSpan.innerHTML = '<span class="valueLabel">value:</span><input type="text" class="valueInput" placeholder="Value">';
            }
        }));
    }
    res.querySelector('.removeBtn').onclick = function(e) {
        e.preventDefault()
        rmCallback(res);
    }
    return res;
}

DomView.prototype._initNodeEvent = function(node, shallow) {
    var url = node.querySelector('a.name').href;
    var self = this;
    var span = node.querySelector(".tree-content");

    span.addEventListener('mouseenter', function(e) {
        span.className = "tree-content tree-content-hover";
        span.querySelector('.removeBtn').onclick = function(e) {
            e.preventDefault()
            var url = e.target.parentNode.querySelector('a').href;
            if (self.showConfirmFunc)
                self.showConfirmFunc(decodeURIComponent(url), self.onRemoveCallback);
        }
        var addBtn = span.querySelector('.addBtn');
        if (addBtn) {
            addBtn.onclick = function(e) {
                e.preventDefault()
                if (!self.globalEditing) {
                    self.globalEditing = true;
                    var url = e.target.parentNode.querySelector('a').href;
                    var editor = self._newEditNode(function(node) {
                        editor.parentNode.removeChild(editor);
                        self.globalEditing = false;
                    });
                    var confirm = self._newConfirm(function() {
                        var res = self._getValueFromEditor(editor);
                        if (res == null) {
                            //TODO show some information here
                            return;
                        }
                        self.onSetCallback(new URL(url)._child(res.key), res.value);
                        self.globalEditing = false;
                        editor.parentNode.removeChild(editor);
                    }, function() {
                        self.globalEditing = false;
                        editor.parentNode.removeChild(editor);
                    })
                    var ul = node.querySelector('ul')
                    var firstChild = ul.firstChild;
                    editor.appendChild(confirm);
                    if (firstChild != null) {
                        ul.insertBefore(editor, firstChild);
                    } else {
                        ul.appendChild(editor);
                    }
                }
            }
        }
        var input = span.querySelector('.valueedit');
        if (input && !self.globalEditing) {
            var originValue = input.value;
            input.disabled = false;
            input.addEventListener('focus', function(e) {
                e.target.removeEventListener(e.type, arguments.callee);
                self.globalEditing = true;
                input.onkeydown = function(e) {
                    if (e.keyIdentifier == 'Enter') {
                        e.target.removeEventListener(e.type, arguments.callee);
                        var _value = e.target.value;
                        try {
                            _value = JSON.parse(_value);
                        } catch (e) {
                            //do nothing
                        }
                        self.onSetCallback(url, _value);
                        e.target.disabled = true;
                        self.globalEditing = false;
                    }
                };
                input.addEventListener('focusout', function(e) {
                    e.target.removeEventListener(e.type, arguments.callee);
                    if (self.globalEditing) {
                        input.value = originValue;
                        self.globalEditing = false;
                    }
                });
            })
        }
    });

    span.addEventListener('mouseleave', function(e) {
        span.className = "tree-content tree-content";
        var input = span.querySelector('.valueedit');
        if (input && !self.globalEditing)
            input.disabled = true;
    })
    var icon = node.querySelector('.jstree-icon');
    var shallowInit = false;
    icon.onclick = function(e) {
        e.preventDefault()
        var current = node.className;
        if (current.indexOf('jstree-closed') !== -1) {
            node.className = current.replace("jstree-closed", 'jstree-open');
            if (shallow && !shallowInit) {
                shallowInit = true;
                self.onQueryCallback(url);
            }
        } else {
            node.className = current.replace("jstree-open", 'jstree-closed');
        }
    }
}

DomView.prototype._newNode = function(url, value, shallow) {
    var self = this;
    var doc = new DOMParser().parseFromString(DomView.Templates.leaf, "text/html");
    var res = doc.body.firstChild;
    var path = decodeURIComponent(url.pathname);
    res.id = this.prx + url.pathname;
    var name = res.querySelector("a.name");
    name.href = url;
    if (path == "/") {
        name.innerText = url.host;
    } else {
        var sp = path.split("/");
        var key = sp[sp.length - 1];
        key = decodeURIComponent(key);
        name.innerText = key;
    }
    if (typeof value != 'object' && true != shallow) {
        //leaf
        var input = res.querySelector("input.valueedit")
        var jsonValue = JSON.stringify(value);
        input.title = jsonValue; //TODO: xss risk
        input.value = jsonValue;
        res.className = "jstree-leaf";
        var addBtn = res.querySelector('.addBtn');
        addBtn.parentNode.removeChild(addBtn)
    } else {
        res.querySelector(".valueContainer").innerHTML = '';
        res.className = "jstree-closed"
    }
    if (!this.hasRoot) {
        this.hasRoot = true;
        res.className = 'jstree-open root'
    }
    //init listeners
    this._initNodeEvent(res, shallow);
    return res;
}


DomView.prototype._updateNodeValue = function(dom, value) {
    if (typeof value != 'object') {
        var input = dom.querySelector("input.valueedit")
        if (input == null) {
            //from a path to a leaf
            dom.querySelector(".valueContainer").innerHTML = ':<input type="text"  class="valueedit valueedit-hover"  disabled="disabled"></span>';
            dom.className = "jstree-leaf";
            input = dom.querySelector("input.valueedit");
            var addBtn = dom.querySelector('.addBtn');
            addBtn.parentNode.removeChild(addBtn);
        }
        var jsonValue = JSON.stringify(value);
        input.title = jsonValue;
        //TODO: xss risk
        input.value = jsonValue;
    } else {
        //do nothing
        //dom.querySelector(".valueContainer").innerHTML = '';
    }
}

DomView.prototype._insertAfter = function(parentDom, url, toInsert) {
    if (url == null) {
        if (parentDom.firstChild == null) {
            parentDom.appendChild(toInsert);
        } else {
            parentDom.insertBefore(toInsert, parentDom.firstChild);
        }

        return;
    }
    var path = decodeURIComponent(url.pathname);
    var prDomId = this.prx + url.pathname;
    var prDom = document.getElementById(prDomId);
    if (prDom == parentDom.lastChild) {
        parentDom.appendChild(toInsert);
    } else {
        parentDom.insertBefore(toInsert, prDom.nextSibling);
    }
}

DomView.prototype.remoteChangeNode = function(url, value) {
    var domId = this.prx + url.pathname;
    var node = document.getElementById(domId);
    if (node != null) {
        if (typeof value != 'object') {
            this._updateNodeValue(node, value);
        }
    }
    //TODO: css class change
    node.querySelector(".tree-content").className = "tree-content changed";
    setTimeout(function() {
        if (node != null) {
            node.querySelector(".tree-content").className = "tree-content";
        }
    }, 1000);

}

DomView.prototype.remoteAddNode = function(url, prKey, value, shallow) {
    var parentDom = this.rootDom;
    if (url.pathname != '/') {
        //not root
        parentDom = document.getElementById(this.prx + url._parent().pathname).querySelector('ul');
    }
    var node = this._newNode(url, value, shallow);
    if (prKey == null) {
        this._insertAfter(parentDom, null, node);
    } else {
        this._insertAfter(parentDom, url._parent()._child(prKey), node);
    }
    node.querySelector(".tree-content").className = "tree-content added";
    setTimeout(function() {
        if (node != null) {
            node.querySelector(".tree-content").className = "tree-content";
        }
    }, 1000);
    //TODO: css class change
}

DomView.prototype.remoteRemoveNode = function(url) {
    var domId = this.prx + url.pathname;
    var node = document.getElementById(domId);
    node.id = "removed:" + node.id;
    //TODO css class remove
    node.querySelector(".tree-content").className = "tree-content removed";
    setTimeout(function() {
        if (node != null) {
            if (node.parentNode != null) {
                node.parentNode.removeChild(node);
            }
        }
    }, 1000);
}

DomView.prototype.remoteMoveNode = function(url, prKey) {
    var domId = this.prx + url.pathname;
    var node = document.getElementById(domId);
    var parentDom = node.parentNode;
    node = parentDom.removeChild(node);
    if (prKey == null) {
        this._insertAfter(parentDom, null, node);
    } else {
        this._insertAfter(parentDom, url._parent()._child(prKey), node);
    }
    node.querySelector(".tree-content").className = "tree-content moved";
    setTimeout(function() {
        if (node != null) {
            node.querySelector(".tree-content").className = "tree-content";
        }
    }, 1000);
}

DomView.prototype.onSet = function(callback) {
    this.onSetCallback = callback;
}

DomView.prototype.onRemove = function(callback) {
    this.onRemoveCallback = callback;
}

DomView.prototype.onQuery = function(callback) {
    this.onQueryCallback = callback;
}


// 分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线分割线


var DogViewer = function(ref, viewController) {
    this.ref = ref;
    this.url = new URL(this.ref.toString());
    this.rootPath = decodeURIComponent(this.url.pathname);
    this.view = viewController;
    this.inited = false;
    this.forceRest = false;
    // this.auth = ref.getAuth()
}

//dom node state: 1:null 2 leaf 3 parent
//null and leaf can be edited
//path can only be removed

DogViewer.prototype.init = function() {
    var self = this;
    if (this.forceRest) {
        self.mode = 1;
        self.inited = true;
        this.initWithRest(ref);
    } else {
        this.ref.on('value', function(snap) {
            //init with client
            //init root
            self.mode = 0;
            if (self.inited) {
                //do nothing
            } else {
                self.inited = true;
                self._addRoot(self.ref, snap.val());
            }

        }, function(err) {
            //init with rest
            self.mode = 1;
            self.inited = true;
            this.initWithRest(ref);
        })
    }

    this.view.onSet(function(url, value) {
        self.ref.child(decodeURIComponent(new URL(url).pathname)).set(value);
        if (self.mode == 1) {
            //rest update view
            self.view.remoteChangeNode(new URL(url), value);
        }
    });
    this.view.onRemove(function(url) {
        self.ref.child(decodeURIComponent(new URL(url).pathname)).remove();
        if (self.mode == 1) {
            this.view.remoteRemoveNode(new URL(url))
        }
    });
    this.view.onQuery(function(url) {

        self._addNodeWithRest(decodeURIComponent(url));

    })
}

DogViewer.prototype.setForceRest = function() {
    this.forceRest = true;
}

DogViewer.prototype._initEventListener = function(ref) {
    var url = new URL(ref.toString());
    var path = decodeURIComponent(url.pathname);
    var self = this;
    ref.orderByPriority().on('child_added', function(snap, prKey) {
        var key = snap.key()
        var value = snap.val();
        self._addNode(ref, key, prKey, value);

    });
    ref.orderByPriority().on('child_removed', function(snap, prKey) {
        var key = snap.key()
        self._removeNode(ref, key);

    });
    ref.orderByPriority().on('child_moved', function(snap, prKey) {
        var key = snap.key()
        self._moveNode(ref, key, prKey);

    });
    ref.orderByPriority().on('child_changed', function(snap, prKey) {
        var key = snap.key()
        var value = snap.val();
        self._changeNode(ref, key, prKey, value);
    });
}

DogViewer.prototype._destroyEventListener = function(ref) {
    var url = new URL(ref.toString());
    var path = decodeURIComponent(url.pathname);
    var self = this;
    ref.orderByPriority().off();
}

DogViewer.prototype._addRoot = function(ref, value) {
    this.view.remoteAddNode(new URL(ref.toString()), null, value);
    this._initEventListener(ref);
}

DogViewer.prototype._addNode = function(ref, key, prKey, value) {
    this.view.remoteAddNode(new URL(ref.child(key).toString()), prKey, value);
    this._initEventListener(ref.child(key));
}

DogViewer.prototype._changeNode = function(ref, key, prKey, value) {
    this.view.remoteChangeNode(new URL(ref.child(key).toString()), value);
}

DogViewer.prototype._removeNode = function(ref, key) {
    this.view.remoteRemoveNode(new URL(ref.child(key).toString()))
    this._destroyEventListener(ref.child(key));
}

DogViewer.prototype._moveNode = function(ref, key, prKey) {
    this.view.remoteMoveNode(new URL(ref.child(key).toString()), prKey);
}

DogViewer.prototype.initWithRest = function(ref) {
    var url = ref.toString();
    this.view.remoteAddNode(new URL(url), null, {});
    this._addNodeWithRest(ref.toString());

}

DogViewer.prototype._addNodeWithRest = function(url) {
    var self = this;
    this._getDataWithRest(url, function(value) {
        if (typeof value == 'object') {
            var prKey = null;
            for (key in value) {
                self.view.remoteAddNode(new URL(url)._child(key), prKey, true, true); //add shallow
                prKey = key;
            }
        } else {
            self.view.remoteChangeNode(new URL(url), value);
        }
    })
}

DogViewer.prototype._getDataWithRest = function(url, callback) {
    var self = this;
    var req = new XMLHttpRequest();
    var _url = url + ".json?shallow=true";
    if (this.auth != null) {
        _url = _url + "&auth =" + this.auth;
    }
    var _url = encodeURI(_url);
    req.open("GET", _url, true);
    req.send(null)
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            var res = req.responseText;
            callback(JSON.parse(res));
        } else {

        }
    }
}
