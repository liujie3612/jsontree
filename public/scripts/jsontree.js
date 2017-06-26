var max_input = 400
var max_char = 100
var min_input = 20

var jsTree = function(el, host, path, opt) {
    var rootDom = $('.jstree');
    var inited = false;
    var elementMap = {};
    var newEmement = null;
    var editing = false;

    var childRef = rootRef.child(path);
    var key = childRef.key();
    
    if (key == null) {
        key = host;
    }

    wilddog.auth().onAuthStateChanged(function(user) {
        //最开始user是null，到了下面signInWithCustomToken后user就有了
        // if (!user) {
        //     return;
        // }
        //
        if (!inited) {
            inited = true;
            wilddog.sync().ref(path).once('value')
                .then(function(snapshot) {
                    var dom = rootDom.find("ul").eq(0);
                    build(dom, path, key, snapshot);
                })
                .catch(function(err) {
                    var err = JSON.parse(JSON.stringify(err))
                        //数据量过大
                    if (err.code == 26104) {
                        $('#loading').hide();
                        $('.data-show .jstree,.data-show .legend').show();
                        $('#tree .data-tips').show();
                        $('.legend .func .unflod,.legend .func .collapse').hide();
                        var s = $(el).find("ul:first")[0];
                        var currentEle = $(rootNode(host, path, key, opt));
                        $('.json-no-icons').find("li").removeClass("jstree-open").addClass("jstree-closed");
                        $(currentEle).appendTo($(s));
                    } else if (err.code == 26102) {
                        $('#loading').hide();
                        $('.data-show .jstree,#tree .source-tips').show();
                    } else if (err.code == 26107) {
                        $('#loading').hide();
                        $('.data-show .jstree,#tree .device-tips').show();
                    }
                });
        }
    });

    // if (opt && opt.token) {
    //     wilddog.auth().signInWithCustomToken(opt.token).then(function() {

    //     }).catch(function(err) {
    //         console.info("login failed", err)
    //     });
    // }

    function build(ele, path, key, snapshot) {
        var tmp = null;
        var val = snapshot.val();

        if (typeof val == 'object') {
            var currentEle = $(newNode(path, key));

            $(currentEle).appendTo($(ele));
        } else {
            var currentEle = $(newLeaf(path, key, snapshot.val()));
            console.log(currentEle)
            $(currentEle).appendTo($(ele));
        }
    }

    var leafTempObj = '<li class="jstree-leaf">' +
        '    <div><ins class="jstree-icon">&nbsp;</ins>' +
        '       <span class="tree-content added">' +
        '       <span>' +
        '           <a class="name" href="{path}"></a>' +
        '           <span class="valueContainer">: ' +
        '           <input type="text" title="{value}" class="valueedit"  value="{value}" disabled="disabled">' +
        '           <span class="sync-func-del"><span class="btn btn-red-full data-confirm">确认删除</span> <span class="data-cancle">取消</span> </span>                                                                ' +
        '           </span>' +
        '       </span>' +
        '        </span>' +
        '    </div>' +
        '</li>';

    function newNode(path, name) {
        var liClass = "jstree-closed";
        if (path == '/') {
            liClass = 'jstree-open js-root';
        }

        var tmp = $('<li class="' + liClass + '" ><div><ins class="jstree-icon">&nbsp;</ins><span class="tree-content added"><span><a class="name" href="{path}"></a><span class="valueContainer"></span></span><span class="sync-func-del"><span class="btn btn-red-full data-confirm">确认删除</span> <span class="data-cancle">取消</span> </span></span></div><ul></ul></li>'
            .replaceAll('{path}', encodeURI(path))
        );

        tmp.find("a").text(name);

        // click the "+" or "-" to control the tree
        tmp.find("ins").click(function() {
            classAttr = $(tmp).attr("class");
            if (classAttr == "jstree-open") {
                $(tmp).attr("class", "jstree-closed");
            } else {
                $(tmp).attr("class", "jstree-open");
            }
        });

        var flag = $('.js-root span.tree-content').hasClass('tree-content-hover');

        if (!flag) {
            tmp.find("span.tree-content").append('<a href="#" class="spriteBtn addBtn"/>');
        }
        if (path != "" && path != "/") {
            tmp.find("span.tree-content").append('<a href="#" class="spriteBtn removeBtn"/>');
            tmp.find("span.tree-content").append('<span class="division">|</span><a href="#" class="spriteBtn importBtn"/>');
            tmp.find("span.tree-content").append('<a href="#" class="spriteBtn exportBtn"/>');
        } else if (!flag) {
            tmp.find("span.tree-content").append('<span class="division">|</span><a href="#" class="spriteBtn importBtn"/>');
            tmp.find("span.tree-content").append('<a href="#" class="spriteBtn exportBtn"/>');
        }

        // when your mouse moved in the node ,buttons will show up
        tmp.find("span.tree-content").hover(function() {
            var flag = $('.js-root span.tree-content').hasClass('tree-content-hover');
            if (editing) {
                return;
            }
            if (!flag) {
                $(this).addClass("tree-content-hover");
                $(this).find("a.addBtn").css('visibility', 'visible');
                $(this).find("a.removeBtn").css('visibility', 'visible');
                $(this).find("a.exportBtn").css('visibility', 'visible');
                $(this).find("a.importBtn").css('visibility', 'visible');
                $(this).find("span.division").css('visibility', 'visible');
            }

            $(this).find("a.addBtn").mouseenter(function() {
                $('.nav-tips').removeClass('nav-tips-top')
            });


        }, function() {
            if (editing) {
                return;
            }
            $(this).removeClass("tree-content-hover");
            $(this).find("a.addBtn").css('visibility', 'hidden');
            $(this).find("a.removeBtn").css('visibility', 'hidden');
            $(this).find("a.exportBtn").css('visibility', 'hidden');
            $(this).find("a.importBtn").css('visibility', 'hidden');
            $(this).find("span.division").css('visibility', 'hidden');
            $(this).find('input[type="file"]').css('visibility', 'hidden');
            $('.nav-tips').removeClass('nav-tips-top');
            $(this).find('.sync-func-del').hide();
        });

        // bind event
        var client = rootRef.child(path);

        tmp.on('click', 'div:first .removeBtn', function(e) {
            e.preventDefault()
            $(this).parents('.tree-content').find('.sync-func-del').show()
        });

        tmp.on('click', 'div:first .data-confirm', function() {
            $(this).parents('.tree-content').find('.sync-func-del').hide()
            client.remove();
        });

        tmp.on('click', 'div:first .data-cancle', function() {
            $(this).parents('.tree-content').find('.sync-func-del').hide()
        });

        tmp.on('click', 'div:first .addBtn', function(e) {
            e.preventDefault()
            var newEdit = newLeafEdit();
            newEmement = newEdit;
            tmp.find("span.tree-content a.addBtn").css('visibility', 'hidden');
            tmp.find("span.tree-content a.removeBtn").css('visibility', 'hidden');
            tmp.find("span.tree-content span.division").css('visibility', 'hidden');
            tmp.find("span.tree-content a.exportBtn").css('visibility', 'hidden');
            tmp.find("span.tree-content a.importBtn").css('visibility', 'hidden');
            $('.nav-tips').removeClass('nav-tips-top');
            tmp.find("span.tree-content").removeClass("tree-content-hover");
            tmp.find('ul:first').prepend(new newConfirm);
            tmp.find('ul:first').prepend(newEdit);
            editing = true;
            editingPath = path;
        });

        client.on('child_added', function(snapshot) {
            var k = snapshot.key()
            var value = snapshot.val()
            var childpath = null;
            if (path == '/') {
                childpath = "/" + k;
            } else {
                childpath = path + "/" + k;
            }
            build(tmp.find("ul:first"), childpath, k, snapshot);
            tmp.find(".tree-content:first").addClass('changed');
            setTimeout(function() {
                if (tmp)
                    tmp.find(".tree-content:first").removeClass('changed');
            }, 1500);
        });

        client.on('child_changed', function(snapshot) {
            if (snapshot.val() == null) {
                // this is a remove event
                return;
            }
            if (elementMap[path])
                elementMap[path].find(".tree-content:first").addClass('changed');
            setTimeout(function() {
                if (elementMap[path])
                    elementMap[path].find(".tree-content:first").removeClass('changed');
            }, 1500);
            elementMap[childpath] = null
        });

        client.on("child_removed", function(snapshot) {
            var k = snapshot.key()
            var v = snapshot.val()
            var childpath = null;
            if (path == '/') {
                childpath = "/" + k;
            } else {
                childpath = path + "/" + k;
            }
            if (elementMap[childpath]) {
                elementMap[childpath].find(".tree-content:first").removeClass("changed").addClass("removed");
            }
            tmp.find(".tree-content:first").addClass('changed');
            setTimeout(function() {
                if (elementMap[childpath]) {
                    elementMap[childpath].remove();
                    // delete elementMap[childpath];
                    elementMap[childpath] = null
                }
                tmp.find(".tree-content:first").removeClass('changed');
            }, 1500);
        });

        elementMap[path] = tmp;
        setTimeout(function() {
            tmp.find(".added:first").removeClass("added");
        }, 1500);
        return tmp;
    }

    function newLeaf(path, name, value) {
        var tmp = $(leafTempObj).clone();
        tmp.find('a').attr('href', encodeURI(path)).text(name);
        tmp.find('input').attr('title', value).attr('value', value);
        var v = toInput(value);
        var client = rootRef.child(path)
        var init = true;
        client.on('value', function(snapshot) {
            if (snapshot.val() != null) {
                tmp.find("input.valueedit:first").val(JSON.stringify(snapshot.val()));
                inputEndEdit(tmp.find("input.valueedit:first"));
                if (init) {
                    init = false;
                } else {
                    tmp.find(".tree-content:first").addClass('changed');
                    setTimeout(function() {
                        if (tmp)
                            tmp.find(".tree-content:first").removeClass('changed');
                    }, 1500);
                }
            } else {
                //client.destroy();
                tmp.remove();
            }
        });

        tmp.find("span.tree-content").hover(function() {
            if (editing) {
                return;
            }
            $(this).addClass("tree-content-hover");
            $(this).append('<a href="#" class="spriteBtn removeBtn"/>');
            $(this).find("input.valueedit:first").addClass("valueedit-hover").removeAttr("disabled");
            $(this).find("input.valueedit:first").blur(function() {
                if (editing) {

                } else {
                    $(this).attr("disabled", "disabled");
                    inputEndEdit(this);
                }
            });
        }, function() {
            var _this = this;
            if (editing) {
                $(document).one('click', function(event) {
                    // $(document).click(function(event) {
                    if (!$(_this).is(event.target) && $(_this).has(event.target).length === 0) {
                        editing = false;
                        $(_this).removeClass("tree-content-hover");
                        $(_this).find("a.removeBtn").remove();
                        $(_this).find("input.valueedit:first").attr("disabled", "disabled");
                        client.once('value', function(snapshot) {
                            $(_this).find("input.valueedit:first").val(JSON.stringify(snapshot.val()));
                            inputEndEdit($(_this).find("input.valueedit:first"))
                        });
                    }
                });
                return;
            }
            $(this).removeClass("tree-content-hover");
            $(this).find("a.removeBtn").remove();
            $(this).find("input.valueedit").attr("disabled", "disabled");
            $(this).find(".sync-func-del").hide()
        });

        tmp.find("input.valueedit:first").focus(function() {
            var _this = tmp;
            editing = true;
            inputStartEdit(this)
        });

        tmp.find("input.valueedit:first").on('keypress', function(e) {
            var _this = tmp;
            if (e.keyCode == 13 && editing) {
                var v = $(_this).find("input.valueedit:first").val();
                $(_this).removeClass("tree-content-hover");
                $(_this).find("a.removeBtn").remove();
                $(_this).find("input.valueedit").attr("disabled", "disabled");
                inputEndEdit($(_this).find("input.valueedit"));
                editing = false;
                client.set(fromInput(v));
            }
        });

        tmp.on('click', 'div:first .removeBtn', function(e) {
            e.preventDefault()
            $(this).parents('.tree-content').find('.sync-func-del').show()
        });

        tmp.on('click', '.data-cancle', function() {
            $(this).parents('.tree-content').find('.sync-func-del').hide()
        });

        tmp.on('click', '.data-confirm', function() {
            $(this).parents('.tree-content').find('.sync-func-del').hide();
            client.root().child(path).remove();
        });

        elementMap[path] = tmp;
        setTimeout(function() {
            tmp.find(".added:first").removeClass("added");
        }, "1500");
        return tmp;
    }

}

function toInput(v) {
    var v = JSON.stringify(v).replace(/\"/g, "&quot;");
    return v;
}

String.prototype.replaceAll = function(s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
}

function inputEndEdit(input) {
    var value = $(input).val();
    var size = value.length;
    $(input).attr("title", value)
    if (size > max_input) {
        size = max_input
    }
    if (size < min_input) {
        size = min_input
    }
    if (size > max_char) {
        value = value.substr(0, max_char) + "..."
    }
    $(input).val(value)
}

function inputStartEdit(input) {
    var title = $(input).attr("title")
    if (title != null) {
        $(input).val(title)
    }
}
