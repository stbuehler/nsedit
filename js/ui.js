
StartUI = (function() {
    function displayDnssecIcon(ui) {
        return function(zone) {
            if (zone.record.dnssec) {
                var $img = $('<img class="list" src="img/lock.png" title="DNSSec Info" />');
                var $p;
                $img.click(function () {
                    ui.widgets.dnssecinfo.html("");
                    $.each(zone.record.keyinfo, function (i, val) {
                        if (val.dstxt) {
                            ui.widgets.dnssecinfo.append($('<p>').append(
                                $('<h2>').text(val.keytype),
                                $('<pre>').text(val.dstxt)
                            ));
                        }
                    });
                    ui.widgets.dnssecinfo.dialog({
                        modal: true,
                        title: "DS-records for "+zone.record.name,
                        width: 'auto',
                        buttons: {
                            Ok: function() {
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                });
                return $img;
            } else {
                return '<img src="img/lock_open.png" title="DNSSec Disabled" />';
            }
        }
    }

    function displayContent(fieldName) {
        return function(data) {
            var value = data.record[fieldName];
            switch (fieldName) {
            case 'priority':
                value = (value === 0) ? '' : value;
                break;
            }
            return $('<span>').text(value);
        }
    }

    function displayRecords(ui, table, slave) {
        var recordTypes = [
            // regular types
            'A',
            'AAAA',
            'CNAME',
            'MX',
            'NS',
            'PTR',
            'SOA',
            'SRV',
            'TXT',
            // crazy types
            'NAPTR',
            'SPF',
            'TLSA',
        ];

        return function(zone) {
            var recordsTable = {
                title: 'Records in ' + zone.record.name,
                ajaxSettings: ui.ajaxSettings,
                messages: {
                    addNewRecord: 'Add to ' + zone.record.name,
                    noDataAvailable: 'No records for ' + zone.record.name
                },
                paging: true,
                pageSize: 20,
                actions: {
                    listAction: ('zones.php?action=listrecords&zoneurl=' + zone.record.url),
                    createAction: !slave && ('zones.php?action=createrecord&zoneurl=' + zone.record.url),
                    deleteAction: !slave && ('zones.php?action=deleterecord&zoneurl=' + zone.record.url),
                    updateAction: !slave && ('zones.php?action=editrecord&zoneurl=' + zone.record.url),
                },
                fields: {
                    id: {
                        key: true,
                        type: 'hidden',
                    },
                    name: {
                        title: 'Label',
                        width: '7%',
                        display: displayContent('name'),
                        inputClass: 'name',
                        listClass: 'name',
                    },
                    type: {
                        title: 'Type',
                        width: '2%',
                        options: recordTypes,
                        display: displayContent('type'),
                        inputClass: 'type',
                        listClass: 'type',
                    },
                    priority: {
                        title: 'Prio',
                        width: '1%',
                        display: displayContent('priority'),
                        defaultValue: ui.session.defaults.priority,
                        inputClass: 'priority',
                        listClass: 'priority',
                    },
                    content: {
                        title: 'Content',
                        width: '30%',
                        create: true,
                        display: displayContent('content'),
                        inputClass: 'content',
                        listClass: 'content',
                    },
                    ttl: {
                        title: 'TTL',
                        width: '2%',
                        create: true,
                        display: displayContent('ttl'),
                        defaultValue: ui.session.defaults.ttl,
                        inputClass: 'ttl',
                        listClass: 'ttl',
                    },
                },
            };

            var $img = $('<img class="list" src="img/list.png" title="Records" />');
            $img.click(function () {
                table.jtable('openChildTable', $img.closest('tr'), recordsTable,
                    function (data) {
                        data.childTable.jtable('load');
                    });
            });
            return $img;
        }
    }

    function LoadUsers(ui) {
        if (!ui.state.users) {
            ui.state.users = {
                cache: [ui.session.username],
                promise: null,
            }
        }
        if (!ui.state.users.promise) {
            var d = $.Deferred();
            ui.state.users.promise = d.promise();

            if (!ui.session.is_adminuser) {
                d.resolve(ui.state.users.cache);
            } else {
                var req = $.ajax($.extend(ui.ajaxSettings, {
                    dataType: 'json',
                    url: 'users.php?action=listnames',
                    success: function(data) {
                        ui.state.users.cache = data;
                        d.resolve(data);
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        ui.state.users = null;
                        d.reject(errorThrown);
                    }
                }));
            }
        }
        return ui.state.users.promise;
    }
    function ReloadUsers(ui) {
        ui.state.users.promise = null;
        return LoadUsers(ui);
    }

    function InitTable_Zones(ui, slave) {
        var table = ui.widgets[slave ? 'SlaveZones' : 'MasterZones'];

        var fields = {};
        fields.id = {
            key: true,
            type: 'hidden',
        };
        fields.name = {
            title: 'Domain',
            width: '8%',
            display: displayContent('name'),
            edit: false,
            inputClass: 'domain',
            listClass: 'domain',
        };
        fields.dnssec = {
            title: 'DNSSEC',
            width: '3%',
            create: false,
            edit: false,
            display: displayDnssecIcon(ui),
            listClass: 'dnssec',
        };
        if (ui.session.is_adminuser) {
            fields.owner = {
                title: 'Owner',
                width: '8%',
                display: displayContent('owner'),
                options: function() {
                    return ui.state.users.cache;
                },
                defaultValue: 'admin',
                inputClass: 'owner',
                listClass: 'owner',
            };
        }
        if (slave) {
            fields.kind = {
                create: true,
                type: 'hidden',
                list: false,
                defaultValue: 'Slave',
            };
            fields.masters = {
                title: 'Masters',
                width: '20%',
                display: function(data) {
                    return $('<span>').text(data.record.masters.join('\n'));
                },
                input: function(data) {
                    var elem = $('<input type="text" name="masters" class="masters">');
                    if (data && data.record) {
                        elem.attr('value', data.record.masters.join(','));
                    }
                    return elem;
                },
                inputClass: 'masters',
                listClass: 'masters'
            };
        } else {
            fields.kind = {
                title: 'Type',
                width: '20%',
                display: displayContent('kind'),
                options: {'Native': 'Native', 'Master': 'Master'},
                defaultValue: ui.session.defaults.defaulttype,
                input: displayContent('kind'), // read only for now
                inputClass: 'kind',
                listClass: 'kind',
            };
            fields.template = {
                title: 'Template',
                options: ui.session.template_names,
                list: false,
                edit: false,
                inputClass: 'template',
            };
            fields.nameserver1 = {
                title: 'Pri. Nameserver',
                list: false,
                edit: false,
                defaultValue: ui.session.defaults.primaryns,
                inputClass: 'nameserver nameserver1',
            };
            fields.nameserver2 = {
                title: 'Sec. Nameserver',
                list: false,
                edit: false,
                defaultValue: ui.session.defaults.secondaryns,
                inputClass: 'nameserver nameserver2',
            };
        }
        fields.serial = {
            title: 'Serial',
            width: '10%',
            display: displayContent('serial'),
            create: false,
            edit: false,
            inputClass: 'serial',
            listClass: 'serial',
        };
        fields.record = {
            width: '5%',
            title: 'Records',
            edit: false,
            create: false,
            display: displayRecords(ui, table, slave),
        };

        var toolbarItems = [];
        if (!slave && ui.session.can_add_zone) {
            toolbarItems.push({
                icon: 'jtable/lib/themes/metro/add.png',
                text: 'Import a new zone',
                click: function() {
                    LoadUsers(ui).then(function() {
                        ui.widgets.ImportZone.jtable('showCreateForm');
                    });
                }
            });
        }

        table.jtable({
            title: slave ? 'Slave Zones' : 'Master/Native Zones',
            paging: true,
            pageSize: 20,
            sorting: false,
            ajaxSettings: ui.ajaxSettings,
            messages: {
                addNewRecord: slave ? 'Add new slave zone' : 'Add new zone',
                noDataAvailable: slave ? 'No slave zones found' : 'No zones found',
            },
            openChildAsAccordion: true,
            actions: {
                listAction: slave ? 'zones.php?action=listslaves' : 'zones.php?action=list',
                updateAction: 'zones.php?action=update',
                createAction: ui.session.can_add_zone && 'zones.php?action=create',
                deleteAction: ui.session.can_delete_zone && 'zones.php?action=delete',
            },
            fields: fields,
            toolbar: {
                items: toolbarItems,
            },
        });

        var addRecordButton = table.find('.jtable-toolbar-item-add-record')
        addRecordButton.off("click", "**");
        addRecordButton.click(function(e) {
            LoadUsers(ui).then(function() {
                table.jtable('showCreateForm');
            });
        });
    }

    function InitTable_ImportZone(ui) {
        var fields = {};

        fields.id = {
            key: true,
            type: 'hidden'
        };
        fields.name = {
            title: 'Domain',
            inputClass: 'domain'
        };
        if (ui.session.is_adminuser) {
            fields.owner = {
                title: 'Owner',
                options: function(data) {
                    return ui.state.users.cache;
                },
                defaultValue: ui.session.username,
                inputClass: 'owner'
            };
        }
        fields.kind = {
            title: 'Type',
            options: {'Native': 'Native', 'Master': 'Master'},
            defaultValue: ui.session.defaults.defaulttype,
            edit: false,
            inputClass: 'type'
        };
        fields.zone = {
            title: 'Zonedata',
            type: 'textarea',
            inputClass: 'zone'
        };
        fields.owns = {
            title: 'Overwrite Nameservers',
            type: 'checkbox',
            values: {'0': 'No', '1': 'Yes'},
            defaultValue: 1,
            inputClass: 'overwrite_namerserver'
        };
        fields.nameserver1 = {
            title: 'Pri. Nameserver',
            create: true,
            list: false,
            edit: false,
            defaultValue: ui.session.defaults.primaryns,
            inputClass: 'nameserver nameserver1'
        };
        fields.nameserver2 = {
            title: 'Sec. Nameserver',
            create: true,
            list: false,
            edit: false,
            defaultValue: ui.session.defaults.secondaryns,
            inputClass: 'nameserver nameserver2'
        };

        ui.widgets.ImportZone.jtable({
            title: 'Import zone',
            messages: {
                addNewRecord: 'Import zone'
            },
            ajaxSettings: ui.ajaxSettings,
            actions: {
                createAction: 'zones.php?action=create',
            },
            fields: fields,
            recordAdded: function() {
                ui.widgets.MasterZones.jtable('load');
                ui.widgets.SlaveZones.jtable('load');
            }
        });
    }

    function InitTable_Users(ui, session) {
        ui.widgets.Users.jtable({
            title: 'Users',
            paging: true,
            pageSize: 20,
            sorting: false,
            actions: {
                listAction: 'users.php?action=list',
                createAction: 'users.php?action=create',
                deleteAction: 'users.php?action=delete',
                updateAction: 'users.php?action=update',
            },
            ajaxSettings: ui.ajaxSettings,
            messages: {
                addNewRecord: 'Add new user'
            },
            fields: {
                id: {
                    key: true,
                    type: 'hidden'
                },
                emailaddress: {
                    title: 'User',
                    display: displayContent('emailaddress'),
                    inputClass: 'emailaddress',
                    listClass: 'emailaddress',
                },
                password: {
                    title: 'Password',
                    type: 'password',
                    list: false,
                    inputClass: 'password',
                },
                isadmin: {
                    title: 'Admin',
                    type: 'checkbox',
                    values: {'0': 'No', '1': 'Yes'},
                    inputClass: 'isadmin',
                    listClass: 'isadmin',
                },
            },
            recordAdded: function() {
                ReloadUsers(ui);
            },
            recordUpdated: function() {
                ReloadUsers(ui);
            },
            recordDeleted: function() {
                ReloadUsers(ui);
            },
        });
    }

    function InitSession(session) {
        var ui = {
            ajaxSettings: {
                type: 'POST',
                dataType: 'json',
                beforeSend: function(xhr, settings) {
                    // these HTTP methods do not require CSRF protection
                    var safeMethod = (/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type));
                    if (!safeMethod && !this.crossDomain) {
                        xhr.setRequestHeader("X-CSRF-Token", session.csrf_token);
                    }
                }
            },
            widgets: {
                dnssecinfo: $('#dnssecinfo'),
                SlaveZones: $('#SlaveZones'),
                MasterZones: $('#MasterZones'),
                ImportZone: $('#ImportZone'),
                domsearch: $('#domsearch'),
                Users: $('#Users'),
                useradmin: $('#useradmin'),
                zoneadmin: $('#zoneadmin'),
            },
            session: session,
            state: {
                users: { cache: [session.username], promise: null }
            }
        };
        window.$ui = ui;

        // cleanup
        var $loading = $('<div class="loading">').text('Loading...');
        $('body').html('').append($loading);
        var container = $('<div class="wrap">');

        var menuItems = $('<ul>');
        function addMenuItem(label) {
            var link = $('<a href="#">').text(label);
            menuItems.append($('<li>').append(link));
            return link;
        }

        ui.widgets.zoneadmin = addMenuItem('Zones');
        if (ui.session.is_adminuser) {
            ui.widgets.useradmin = addMenuItem('Users');
        }
        ui.widgets.logout = addMenuItem('Logout');

        container.append(
            ui.widgets.dnssecinfo = $('<div>'),
            $('<div class="menu jtable-main-container">').append(
                $('<div class="jtable-title">').append($('<div class="jtable-title-text">').text('Menu')),
                menuItems
            ),
            $('<div class="zones">').append(
                ui.widgets.ImportZone = $('<div class=".ImportZone" style="display:none;">'),
                ui.widgets.MasterZones = $('<div class="tables MasterZones">').append(
                    $('<div class="searchbar">').append(
                        ui.widgets.domsearch = $('<input type="text" id="domsearch" name="domsearch" placeholder="Search....">')
                    )
                ),
                ui.widgets.SlaveZones = $('<div class="tables SlaveZones">')
            ),
            $('<div class="users">').append(
                ui.widgets.Users = $('<div class="tables">')
            )
        );

        LoadUsers(ui);

        InitTable_Zones(ui, true); // slave
        InitTable_Zones(ui, false); // master+native
        InitTable_ImportZone(ui);

        ui.widgets.domsearch.on('input', function (e) {
            e.preventDefault();
            ui.widgets.MasterZones.jtable('load', {
                domsearch: ui.widgets.domsearch.val()
            });
            ui.widgets.SlaveZones.jtable('load', {
                domsearch: ui.widgets.domsearch.val()
            });
        });
        ui.widgets.logout.click(function(event) {
            event.preventDefault();
            $.ajax($.extend(ui.ajaxSettings, {
                url: 'logout.php',
                dataType: null,
            })).done(function() {
                ShowLogin($config);
            }).fail(function() {
                window.location.reload();
            });
        });

        ui.widgets.Users.hide();
        ui.widgets.useradmin.click(function (event) {
            event.preventDefault();
            ui.widgets.Users.show();
            ui.widgets.MasterZones.hide();
            ui.widgets.SlaveZones.hide();
        });
        ui.widgets.zoneadmin.click(function (event) {
            event.preventDefault();
            ui.widgets.Users.hide();
            ui.widgets.MasterZones.show();
            ui.widgets.SlaveZones.show();
        });
        if (ui.session.is_adminuser) {
            InitTable_Users(ui);
            ui.widgets.Users.jtable('load');
        }

        ui.widgets.MasterZones.jtable('load');
        ui.widgets.SlaveZones.jtable('load');

        $loading.remove();
        $('body').prepend(container);

        // addClear bug: requires element to actually exist in DOM for $("a[href='#clear']")
        ui.widgets.domsearch.addClear({
            onClear: function() {
                ui.widgets.MasterZones.jtable('load');
                ui.widgets.SlaveZones.jtable('load');
            }
        });
    }

    function ShowLogin() {
        var $loading = $('<div class="loading">').text('Loading...');
        $('body').html('').append($loading);

        var $loginblock = $('<div class="loginblock">');

        if ($config.logourl) {
            $loginblock.append(
                $('<div class="logo">').append($('<img alt="Logo">').attr(src, $config.logourl))
            );
        }

        var $username = $('<input type="text" name="username">');
        var $password = $('<input type="password" name="password">');
        var $autologin;

        $fields = [
            $('<tr>').append(
                $('<td class="label">').text("Username:"),
                $('<td>').append($username)
            ),
            $('<tr>').append(
                $('<td class="label">').text("Password:"),
                $('<td>').append($password)
            ),
        ];
        if ($config.support_autologin) {
            $autologin = $('<input type="checkbox" name="autologin" value="1">');
            $fields.push(
                $('<tr>').append(
                    $('<td class="label">').text("Remember me:"),
                    $('<td>').append($autologin)
                )
            );
        }
        $fields.push(
            $('<input type="submit" name="submit" value="Log me in!">')
        );

        var $form = $('<form>').append(
            $('<table>').append($fields)
        );

        $form.submit(function(event) {
            $('body').html('Logging in...');

            var loginData = {
                username: $username.val(),
                password: $password.val(),
            }
            if ($config.support_autologin && $autologin.val()) {
                loginData.autologin = 1;
            }
            $.ajax({
                type: 'POST',
                url: 'login.php',
                data: loginData,
                encode: true,
                dataType: 'json'
            }).done(function (session) {
                InitSession(session);
            }).fail(function () {
                ShowLogin();
                alert('Invalid credentials.')
            });

            event.preventDefault();
        });

        $loginblock.append($('<div class="login">').append($form));

        $loading.remove();
        $('body').prepend($loginblock);
        $username.focus();
    }

    return function(session) {
        if (session) {
            InitSession(session);
        } else {
            ShowLogin($config);
        }
    }
})();
