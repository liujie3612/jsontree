var max_input = 400
var max_char = 100

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
        '<input type="text" class="valueedit" name="{value}" value="{value}" disabled="disabled">' +
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


var jsTree = function(el, host, path, opt) {
    var rootDom = $('.jstree');
    var elementMap = {};
    var newElement = null;
    var editing = false;
    var dom = rootDom.find("ul").eq(0);


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
            console.log(path)
            var currentEle = $(newLeaf(path, key, val));
        }
        $(currentEle).appendTo($(ele));

        setTimeout(function() {
            ele.find(".tree-content").removeClass("added");
        }, 1000);

    }

    //nodeobj
    function newNode(path, name) {
        var liClass = 'jstree-closed';
        var rootIsHover = $('.js-root span.tree-content').hasClass('tree-content-hover');
        if (path == '/') {
            liClass = 'jstree-open js-root';
        }
        var nodeTemlObj = templObj.nodeObj.replace('jstree-closed', liClass);
        var nodeTemlObj = $(nodeTemlObj).clone();

        initNodeEvent(nodeTemlObj, path, name)
        initEventListener(nodeTemlObj, path)

        return nodeTemlObj;
    }

    //leafobj
    function newLeaf(path, name, value) {
        var leafTemlObj = $(templObj.leafObj).clone();
        initNodeEvent(leafTemlObj, path, name, value);
        return leafTemlObj;
    }

    function initNodeEvent(ele, path, name, value) {
        $(ele).find("a.name").text(name).attr('href', encodeURI(path));
        var treeContent = $(ele).find('.tree-content')

        //两种判断情况
        var addBtn = treeContent.find('.addBtn');
        var input = treeContent.find('.valueedit');

        if (addBtn) {
            $(ele).find("ins").click(function() {
                $(ele).toggleClass('jstree-open jstree-closed')
            });
        }

        if (input && !editing) {
            input.attr({ 'name': value, 'value': value });
            input.focus(function(e) {
                e.target.removeEventListener(e.type, arguments.callee);
                editing = true;
                inputStartEdit(this)

                input.on('keypress', function(e) {
                    var self = $(ele);
                    if (e.keyCode == 13 && editing) {
                        var val = self.find("input.valueedit:first").val();
                        self.removeClass("tree-content-hover");
                        inputEndEdit(self.find("input.valueedit"));
                        editing = false;
                        // client.set(fromInput(val));
                    }
                });
            });

            $(ele).on('click', 'div:first .removeBtn', function(e) {
                e.preventDefault()
                $(this).parents('.tree-content').find('.sync-func-del').fadeIn(100);
            });

            $(ele).on('click', '.data-cancle', function() {
                $(this).parents('.tree-content').find('.sync-func-del').hide()
            });
        }

        $(ele).find("span.tree-content").hover(function() {
            if (editing) {
                return;
            }
            $(this).addClass("tree-content-hover");
            $(this).find("input.valueedit:first").removeAttr("disabled");
            if (input) {
                input.on('blur', function(e) {
                    e.target.removeEventListener(e.type, arguments.callee);
                    if (editing) {
                        input.val(value)
                        editing = false;
                    } else {
                        inputEndEdit(this)
                        input.attr("disabled", "disabled");
                    }
                });
            }

        }, function() {
            var _this = this;
            if (editing) {
                $(document).one('click', function(event) {
                    if (!$(_this).is(event.target) && $(_this).has(event.target).length === 0) {
                        editing = false;
                        $(_this).removeClass("tree-content-hover");
                        $(_this).find("input.valueedit:first").attr("disabled", "disabled");
                    }
                });
                return
            }

            $(this).removeClass("tree-content-hover");
            $(this).find("input.valueedit").attr("disabled", "disabled");
            $(this).find(".sync-func-del").hide()
        })

    }

    function initEventListener(nodeTemlObj, path) {
        var client = rootRef.child(path);
        
        client.orderByPriority().on('child_added', function(snapshot) {
            var key = snapshot.key()
            var value = snapshot.val()
            var childpath = '';
            if (path == '/') {
                childpath = "/" + key;
            } else {
                childpath = path + "/" + key;
            }

            build(nodeTemlObj.find("ul:first"), childpath, key, snapshot);
        });

    }

    function destroyEventListener(path) {
        var client = rootRef.child(path)
        client.orderByPriority().off();
    }
}

function toInput(value) {
    var value = JSON.stringify(value).replace(/\"/g, "&quot;");
    return value;
}

String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

function inputEndEdit(input) {
    var value = $(input).val();
    var size = value.length;

    if (size > max_char) {
        value = value.substr(0, max_char) + "..."
    }
    $(input).val(value)
}

function inputStartEdit(input) {
    var name = $(input).attr("name");
    if (name != null) {
        $(input).val(name)
    }
}
