var templObj = {
    nodeObj: '<li class="jstree-closed">' +
        '<div><ins class="jstree-icon">&nbsp;</ins>' +
        '<span class="tree-content added">' +
        '<span>' +
        '<a class="name" href="{path}">' +
        '</a>' +
        '<span class="valueContainer"></span>' +
        '</span>' +
        '<span class="sync-func-del">' +
        '<span class="btn btn-red-full data-confirm">确认删除</span> ' +
        '<span class="data-cancle">取消</span> ' +
        '</span>' +
        '<span class="btn-func">' +
        '<a href="#" class="spriteBtn addBtn"/>' +
        '<a href="#" class="spriteBtn removeBtn"/>' +
        '<span class="division">|</span>' +
        '<a href="#" class="spriteBtn importBtn"/>' +
        '<a href="#" class="spriteBtn exportBtn"/>' +
        '<span>' +
        '</span>' +
        '</div>' +
        '<ul></ul>' +
        '</li>',
    leafObj: '<li class="jstree-leaf">' +
        '<div><ins class="jstree-icon">&nbsp;</ins>' +
        '<span class="tree-content added">' +
        '<span>' +
        '<a class="name" href="{path}"></a>' +
        '<span class="valueContainer">: ' +
        '<input type="text" class="valueedit" name="" value="" disabled="disabled">' +
        '<span class="sync-func-del"><span class="btn btn-red-full data-confirm">确认删除</span><span class="data-cancle">取消</span></span>' +
        '</span>' +
        '</span>' +
        '<a href="#" class="spriteBtn removeBtn"/>' +
        '</span>' +
        '</div>' +
        '</li>',
    editor: '<li class="jstree-leaf adding">' +
        '<div>' +
        '<ins class="jstree-icon">&nbsp;</ins>' +
        '<span class="tree-content">' +
        '<span>' +
        '<span class="nameLabel">name:</span>' +
        '<input type="text" class="nameInput" placeholder="Name" autofocus>' +
        '<span>' +
        '<span class="valueLabel">value:</span>' +
        '<input type="text" class="valueInput" placeholder="Value">' +
        '</span>' +
        '</span>' +
        '<a href="#" class="spriteBtn addBtn">&nbsp;</a>' +
        '<a href="#" class="spriteBtn removeBtn">&nbsp;</a>' +
        '</span>' +
        '</div>' +
        '</li>',
    confirm: '<li class="confirm">' +
        '<ins>&nbsp;</ins>' +
        '<a href="#" class="spriteBtn cancelBtn" id="cancelBtn"></a>' +
        '<a href="#" class="spriteBtn confirmBtn" id="confirmBtn"></a>' +
        '</li>'
}


var jsTree = function(el, host, path, opt) {
    var rootDom = $('.jstree');
    var elementMap = {};
    var newElement = null;
    var editing = false;
    var dom = rootDom.find("ul").eq(0);
    var delkeys = []

    var childRef = rootRef.child(path);
    var key = childRef.key();

    if (key == null) {
        key = host;
    }

    wilddog.auth().onAuthStateChanged(function(user) {
        wilddog.sync().ref(path).once('value')
            .then(function(snapshot) {
                build(dom, path, key, snapshot);
            })
    });

    function build(ele, path, key, snapshot) {
        var val = snapshot.val();
        if (typeof val == 'object') {
            var currentEle = $(newNode(path, key));
        } else {
            var currentEle = $(newLeaf(path, key, val));
        }

        $(currentEle).appendTo($(ele));

        setTimeout(function() {
            $(ele).find(".added:first").removeClass("added");
        }, 1200);
    }

    //nodeobj
    function newNode(path, name) {
        var liClass = 'jstree-closed';
        // var rootIsHover = $('.js-root span.tree-content').hasClass('tree-content-hover');
        if (path == '/') {
            liClass = 'jstree-open js-root';
        }
        var nodeTemlObj = templObj.nodeObj.replace('jstree-closed', liClass);
        var nodeTemlObj = $(nodeTemlObj).clone();

        initNodeEvent(nodeTemlObj, path, name)
        initEventListener(nodeTemlObj, path, 'nodeObj')
        elementMap[path] = $(nodeTemlObj);
        return nodeTemlObj;
    }

    //leafobj
    function newLeaf(path, name, value) {
        var leafTemlObj = $(templObj.leafObj).clone();
        initLeafEvent(leafTemlObj, path, name, value);
        initEventListener(leafTemlObj, path, 'leafObj')
        elementMap[path] = $(leafTemlObj);
        return leafTemlObj;
    }

    function initNodeEvent(ele, path, name) {
        $(ele).find("a.name").text(name).attr('href', encodeURI(path));
        var treeContent = $(ele).find('.tree-content');
        var addBtn = treeContent.find('.addBtn');

        $(ele).find("ins").click(function() {
            $(ele).toggleClass('jstree-open jstree-closed')
        });

        addBtn.on('click', function(e) {
            e.preventDefault()
            editing = true;
            //打开节点
            $(this).parents('li').removeClass('jstree-closed').addClass('jstree-open')
            var newEdit = newLeafEdit();
            newElement = newEdit;

            // $('.nav-tips').removeClass('nav-tips-top');
            $(ele).find("span.tree-content").removeClass("tree-content-hover");
            $(ele).find('ul:first').prepend(new newConfirm(path));
            $(ele).find('ul:first').prepend(newEdit);

        })

        //normal
        $(ele).find("span.tree-content").hover(function() {
            if (editing) {
                return;
            }
            $(this).addClass("tree-content-hover");
        }, function() {
            if (editing) {
                return;
            }
            $(this).removeClass("tree-content-hover");
            $(this).find(".sync-func-del").hide()
        })

        $(ele).on('click', 'div:first .removeBtn', function(e) {
            e.preventDefault()
            $(this).parents('.tree-content').find('.sync-func-del').fadeIn(100);
        });

        $(ele).on('click', '.data-cancle', function() {
            $(this).parents('.tree-content').find('.sync-func-del').hide()
        });

        $(ele).on('click', 'div:first .data-confirm', function() {
            // $(this).parents('.tree-content').find('.sync-func-del').hide();
            onQuery(path, function(snap) {
                var delObj = snap.val();
                onRemove(path)
                delkeys = [];
                delkeys = showAllKey(delObj);
                delkeys.forEach(function(key, index) {
                    if (path == '/') {
                        var childpath = "/" + key;
                    } else {
                        var childpath = path + "/" + key;
                    }
                    onRemove(childpath);
                });
            })
        });
    }

    function initLeafEvent(ele, path, name, value) {
        $(ele).find("a.name").text(name).attr('href', encodeURI(path));
        var treeContent = $(ele).find('.tree-content');
        var input = treeContent.find('.valueedit');

        input.focus(function(e) {
            // e.target.removeEventListener(e.type, arguments.callee);
            editing = true;
            input.on('keypress', function(e) {
                var self = $(ele);
                if (e.keyCode == 13 && editing) {
                    editing = false;
                    var val = self.find("input.valueedit:first").val();
                    self.removeClass("tree-content-hover");
                    self.find("input.valueedit").attr("disabled", "disabled");
                    inputEndEdit(self.find("input.valueedit"));
                    onSet(path, valToJson(val));
                }
            });
        });

        $(ele).find("span.tree-content").hover(function() {
            if (editing) {
                return;
            }

            $(this).addClass("tree-content-hover");
            $(this).find("input.valueedit:first").removeAttr("disabled");
            input.on('blur', function(e) {
                // e.target.removeEventListener(e.type, arguments.callee);
                inputEndEdit(this)
                input.attr("disabled", "disabled");
            });
        }, function() {
            var _this = this;
            if (editing) {
                $(document).one('click', function(event) {
                    if (!$(_this).is(event.target) && $(_this).has(event.target).length === 0) {
                        editing = false;
                        $(_this).removeClass("tree-content-hover");
                        $(_this).find("input.valueedit:first").attr("disabled", "disabled");
                        onQuery(path, function(snapshot) {
                            $(_this).find("input.valueedit:first").val(JSON.stringify(snapshot.val()));
                            inputEndEdit($(_this).find("input.valueedit:first"))
                        })
                    }
                });
                return
            }
            $(this).removeClass("tree-content-hover");
            $(this).find("input.valueedit").attr("disabled", "disabled");
            $(this).find(".sync-func-del").hide()
        })

        $(ele).on('click', 'div:first .removeBtn', function(e) {
            e.preventDefault()
            $(this).parents('.tree-content').find('.sync-func-del').fadeIn(100);
        });

        $(ele).on('click', '.data-cancle', function() {
            $(this).parents('.tree-content').find('.sync-func-del').hide()
        });

        $(ele).on('click', '.data-confirm', function() {
            onRemove(path);
        });

    }

    function newLeafEdit() {
        /*点击'+'号出现的新叶*/
        var listSize = 0;
        var leafEditObj = $(templObj.editor).clone();

        leafEditObj.on('click', 'ul:first>li>div .removeBtn', function(e) {
            e.preventDefault()
            $(this).parents("li:first").remove();
            listSize -= 1;

            if (listSize == 0) {
                leafEditObj.remove("ul:first");
                leafEditObj.find("input.valueInput:first").parent().show()
            }
        });

        leafEditObj.on('click', 'div:first .addBtn', function(e) {
            e.preventDefault()
            var newEdit = newLeafEdit();

            if (listSize == 0) {
                leafEditObj.append("<ul></ul>");
                leafEditObj.find("input.valueInput:first").parent().hide()
            }

            leafEditObj.find('ul:first').append(newEdit);
            listSize += 1;

        });

        return leafEditObj;
    }


    function showAllKey(obj) {
        for (var key in obj) {
            if (typeof obj[key] == 'object') {
                delkeys.push(key)
                showAllKey(obj[key])
            } else {
                delkeys.push(key)
            }
        }
        return delkeys
    }

    function buildData(ele) {
        var res = {};
        var key = ele.find("span.tree-content:first input.nameInput:first").val();
        var value = ele.find("span.tree-content:first input.valueInput:first").val();
        if (value[0] == "\"" && value[value.length - 1] == "\"") {
            value = JSON.parse(value);
        }
        if (key == null || key == "") {
            return res
        }
        var childList = ele.find("ul:first>li");

        if (childList != null && childList.length > 0) {
            var childObj = {};
            for (var i = 0; i < childList.length; i++) {
                var childItem = buildData($(childList[i]));
                for (k in childItem) {
                    if (childItem.hasOwnProperty(k)) {
                        if (typeof childItem[k] == 'object') {
                            if (!isEmpty(childItem[k])) {
                                childObj[k] = childItem[k];
                            }
                        } else {
                            childObj[k] = childItem[k];
                        }
                    }
                }
            }

            if (!isEmpty(childObj))
                res[key] = childObj;
        } else if (value != null) {
            res[key] = value;
        }

        return res;
    }

    function newConfirm(path) {
        var confirmObj = $(templObj.confirm).clone();

        var onConfirm = function(dom, path) {
            var obj = buildData(newElement);
            editing = false;
            for (key in obj) {
                // 跳过继承属性
                if (!obj.hasOwnProperty(key)) continue;
                if (obj[key] != null && !isEmpty(obj[key])) {
                    var path = path + '/' + key
                    onSet(path, obj[key]);
                    $(dom).parents('ul:first').find('.adding,.confirm').remove()
                }
            }
        }

        var onCancel = function(dom) {
            editing = false;
            $(dom).parents('ul:first').find('.adding,.confirm').remove()
        };

        confirmObj.on('click', '.confirmBtn', function(e) {
            e.preventDefault();
            onConfirm($(this), path);
        });

        confirmObj.on('click', '.cancelBtn', function(e) {
            e.preventDefault()
            onCancel($(this));
        });

        newElement.on("click", "div:first a.removeBtn", function(e) {
            e.preventDefault()
            onCancel($(this));
        });

        return confirmObj;
    }

    function initEventListener(temlObj, path, controller) {
        var client = rootRef.child(path);

        // obj 递归创建
        if (controller == 'nodeObj') {
            client.on('child_added', function(snapshot) {
                var key = snapshot.key()
                var value = snapshot.val()
                var childpath = '';
                if (path == '/') {
                    childpath = "/" + key;
                } else {
                    childpath = path + "/" + key;
                }
                // 递归构建
                build(temlObj.find("ul:first"), childpath, key, snapshot);

                temlObj.find(".tree-content:first").removeClass('added removed').addClass('changed')
                setTimeout(function() {
                    temlObj.find(".tree-content:first").removeClass('changed');
                }, 1500);

            });

            client.on('child_changed', function(snapshot) {
                var key = snapshot.key()
                var value = snapshot.val()
                if (snapshot.val() == null) {
                    return;
                }

                if (typeof value != 'object') {
                    // updateNodeValue();
                }

                temlObj.find(".tree-content:first").removeClass('added removed').addClass('changed');
                setTimeout(function() {
                    temlObj.find(".tree-content:first").removeClass('changed');
                }, 1500);

            });

            client.on("child_removed", function(snapshot) {
                var key = snapshot.key()
                var value = snapshot.val()
                console.log(value)
                var childpath = '';
                if (path == '/') {
                    childpath = "/" + key;
                } else {
                    childpath = path + "/" + key;
                }

                if (elementMap[childpath]) {
                    elementMap[childpath].find(".tree-content:first").removeClass('added changed').addClass("removed");
                    destroyEventListener(childpath)
                }

                setTimeout(function() {
                    if (elementMap[childpath]) {
                        elementMap[childpath].remove();
                        delete elementMap[childpath];
                    }
                }, 600);

                //向上加修改
                temlObj.find(".tree-content:first").removeClass('added removed').addClass('changed');
                setTimeout(function() {
                    temlObj.find(".tree-content:first").removeClass('changed');
                }, 1500);
            });

            //moved status
        }

        // 叶子节点监听数据的变化
        if (controller == 'leafObj') {
            var init = true;
            client.on('value', function(snapshot) {
                if (snapshot.val() != null) {
                    var key = snapshot.key()
                    var value = snapshot.val()
                    temlObj.find("input.valueedit").val(JSON.stringify(value));

                    //input赋值
                    inputEndEdit(temlObj.find("input.valueedit"));
                    if (init) {
                        init = false;
                    } else {
                        temlObj.find(".tree-content:first").removeClass('added removed').addClass('changed');
                        setTimeout(function() {
                            if (temlObj) {
                                temlObj.find(".tree-content:first").removeClass('changed');
                            }
                        }, 1500);
                    }
                } else {
                    temlObj.remove()
                }
            })
        }
    }

    function onSet(path, value) {
        rootRef.child(path).set(value)
    }

    function onRemove(path) {
        rootRef.child(path).remove();
        destroyEventListener(path)
    }

    function onQuery(path, callback) {
        rootRef.child(path).once('value', function(snap) {
            callback(snap)
        })
    }

    function destroyEventListener(path) {
        var client = rootRef.child(path)
        client.off();
    }


}

function valToJson(value) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return value;
    }
}

function inputEndEdit(input) {
    var value = $(input).val();
    var size = value.length;

    $(input).attr({ 'name': value, 'value': value })
    if (size > 100) {
        value = value.substr(0, 100) + "..."
    }
    $(input).val(value)
}

function isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
};
