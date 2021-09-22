//作者: G大师
//默认在校
//默认非中高风险地区
var debugMode = false;

auto();
auto.waitFor();
var deviceUnlocker = require("解锁屏幕.js");
var isScreenNeedToBeLocked;
var thread_main;
var thread_main_monitor;
var storage = storages.create("wechatEpidemicReport");

if (debugMode || storage.get("lastRanDate") != new Date().getDate() || storage.get("lastRanState") != "success") {
    storage.put("lastRanDate", new Date().getDate());
    storage.remove("lastRanState");
    unlockAndEnterMainSession();
    thread_main_monitor = threads.start(thread_main_monitor_enable);
} else {
    toastLog("already reported!");
    if (device.isScreenOn()) {
        dialogs
            .build({
                title: "今日疫情上报已完成，无需重复上报",
                positive: "确认并退出",
                negative: "仍要填报",
            })
            .on("negative", () => {
                unlockAndEnterMainSession();
                thread_main_monitor = threads.start(thread_main_monitor_enable);
            })
            .on("positive", () => {
                exit();
            })
            .show();
    }
}

function epidemicReport() {
    launchApp("微信");
    sleep(1000);

    for (let i = 0; i < 5; i++) {
        if (!text("微信").findOne(1000)) {
            back();
            sleep(1000);
        }
    }

    if (!text("北京邮电大学").findOne(5000)) {
        swipe(device.width / 2, device.height / 2 - 200, device.width / 2, device.height / 2, 10);
        //swipe(540, 1000, 540, 1200, 10);
        for (let i = 0; i < 5; i++) {
            if (!text("北京邮电大学").findOne(500)) {
                swipe(device.width / 2, device.height * 0.75, device.width / 2, device.height / 4, 500);
                //swipe(500, 1300, 500, 500, 500);
                sleep(1000);
            }
        }
    }

    sleep(1000);
    smartClick(text("北京邮电大学").findOne(10000));
    sleep(1000);

    smartClick(textContains("疫情防控通").findOne(10000));

    smartClick(textContains("每日填报").findOne(10000));
    sleep(1000);

    smartClick(textContains("每日填报").findOne(30000));

    textContains("每日上报").findOne(30000);
    sleep(3000);

    smartClick(textContains("所在地点（请打开手机位置功能，并在手机权限设置中选择允许微信访问位置信息）").findOne(10000));
    smartClick(text("允许").findOne(10000));
    sleep(3000);

    textContains("今日是否在校").findOne(10000).parent().child(4).click(); //4:no 3:yes

    textContains("今日是否在中高风险地区").findOne(10000).parent().child(4).click(); //no

    textContains("今日体温范围").findOne(10000).parent().child(5).click(); //36.6-36.9°

    textContains("今日是否接触密接人员").findOne(10000).parent().child(4).click(); //no

    textContains("近21日内本人/共同居住者是否去过疫情发生场所（市场、单位、小区等）或与场所人员有过密切接触？").findOne(10000).parent().child(4).click(); //no

    textContains("疫苗接种相关情况").findOne(1000).parent().child(3).setText("已接种");

    //textContains("提交信息").findOne(3000).click();
    smartClick(textContains("提交信息").findOne(3000));

    //textContains("确认\nSubmit").findOne(3000).click();
    smartClick(textContains("确认\nSubmit").findOne(3000));
    sleep(1000);

    if (text("提交信息成功").findOne(3000) || textContains("每天只能填报一次，你已提交过").findOne(3000)) {
        smartClick(text("确定").findOne(1000));

        for (let i = 0; desc("返回").findOne(1000) && i < 10; i++) {
            smartClick(desc("返回").findOne(1000));
            sleep(2000);
        }
        home();
        storage.put("lastRanState", "success");
        let records = storage.get("records");
        let records_new = [];
        records_new = records.concat(new Date(), true);
        storage.put("records", records_new);
        //sendNotification("填报完成~", "", "", "", "疫情上报");
        weChatPush("填报完成~ (❁´◡`❁)*✲ﾟ*");
        if (isScreenNeedToBeLocked) {
            for (let i = 0; i < 2 * 60; i++) {
                if (device.isScreenOn()) {
                    sleep(1000);
                }
            }
            device.setBrightnessMode(1); //改回自动亮度
            //KeyCode(26);
        }
    } else {
        storage.put("lastRanState", "failed");
        let records = storage.get("records");
        let records_new = [];
        records_new = records.concat(new Date(), false);
        storage.put("records", records_new);
        weChatPush("填报失败\\__(:з」∠)__");
        if (isScreenNeedToBeLocked) {
            for (let i = 0; i < 2 * 60; i++) {
                if (device.isScreenOn()) {
                    sleep(1000);
                }
            }
            device.setBrightnessMode(1); //改回自动亮度
            //KeyCode(26);
        }
        thread_main_monitor.interrupt();
        sendNotification("填报失败", "请联系作者", "", "", "疫情上报");
        alert("脚本失效，填报未完成，请联系作者");
        console.error("填报未完成");
        app.startActivity({
            action: "android.intent.action.VIEW",
            data: "mqq://im/chat?chat_type=wpa&version=1&src_type=web&uin=673193983",
            packageName: "com.tencent.mobileqq",
        });
        //return "failed";
    }

    thread_main_monitor.interrupt();
}

function thread_main_monitor_enable() {
    log("防超时定时器已启动");
    for (let i = 0; i < 300; i++) {
        sleep(1000);
    }
    if (thread_main) {
        // 如果取消了此次脚本 则thread_main为空
        thread_main.interrupt();
        weChatPush("填报超时\\__(:з」∠)__");
        console.error("疫情填报超时");
        alert("疫情填报超时,请联系作者");
    }
}

function unlockAndEnterMainSession() {
    if (device.isScreenOn()) {
        isScreenNeedToBeLocked = false;
        let actionSlected = false;
        let dialog_start = dialogs
            .build({
                title: "是否开始疫情填报?",
                positive: "确认",
                negative: "取消",
                neutral: "稍后提醒",
            })
            .on("any", (action, dialog) => {
                actionSlected = true;
                if (action == "positive") {
                    thread_main = threads.start(epidemicReport);
                } else if (action == "negative") {
                    toast("此次签到已取消");
                    console.info("opration aborted mannually");
                    exit();
                } else if (action == "neutral") {
                    let delayTime = dialogs.input("延时时间(min):", "4");
                    toastLog("延时%d分钟", delayTime); //%d好像只在log()里起作用
                    sleep(delayTime * 60 * 1000);
                    unlockAndEnterMainSession();
                }
            })
            .on("dismiss", (dialog) => {
                if (!actionSlected) {
                    //未选择选项直接点击屏幕外解散对话框则默认延时
                    toastLog("延时5分钟");
                    sleep(5 * 60 * 1000);
                    unlockAndEnterMainSession();
                }
            });

        dialog_start.show();
    } else {
        isScreenNeedToBeLocked = true;
        device.setBrightnessMode(0);
        device.setBrightness(0);
        if (deviceUnlocker.unlockDevice()) {
            thread_main = threads.start(epidemicReport);
        } else {
            sendNotification("解锁屏幕失败", "", "", "", "疫情上报");
            alert("解锁屏幕失败！");
            exit();
        }
    }
}

function smartClick(widget) {
    if (widget) {
        if (widget.clickable()) {
            widget.click();
            sleep(100);
            return true;
        } else {
            let widget_temp = widget.parent();
            for (let triedTimes = 0; triedTimes < 5; triedTimes++) {
                if (widget_temp.clickable()) {
                    widget_temp.click();
                    sleep(100);
                    return true;
                }
                widget_temp = widget_temp.parent();
                if (!widget_temp) {
                    break;
                }
            }

            click(widget.bounds().centerX(), widget.bounds().centerY());
            sleep(100);
            return true;
        }
    } else {
        // console.verbose('invalid widget')
        console.trace("invalid widget : ");
        return false;
    }
}

//e.g. weChatPush_ServerChan("message body")
function weChatPush_ServerChan() {
    let storage_privateinfo = storages.create("privateInformation");
    let url, msgTitle, msgBody, openid;
    if (arguments.length == 1) {
        msgBody = arguments[0];
    } else {
        for (let i = 0; i < arguments.length; ) {
            let elementDesc = arguments[i++];
            let element = arguments[i++];
            switch (elementDesc) {
                case "title":
                    msgTitle = element;
                    break;
                case "body":
                    msgBody = element;
                    break;
                case "url":
                    url = element;
                    break;
                case "openid":
                    openid = element;
                    break;
                default:
                    console.trace(arguments);
            }
        }
    }

    if (!url) {
        let weChatSendKey = storage_privateinfo.get("serverChanSendKey"); //let weChatSendKey = ***......***使用了Server酱的API，请自行去https://sct.ftqq.com/申请
        if (weChatSendKey) {
            url = "https://sctapi.ftqq.com/" + weChatSendKey + ".send?";
        } else {
            toastLog("Configuration needed to enable push service");
            return "failed";
        }
    }
    if (!msgTitle) {
        let dateTime = new Date();
        let dateStr = dateTime.toLocaleDateString().substr(5);
        let timeStr = dateTime.toTimeString().substr(0, 5);
        msgTitle = dateStr + timeStr;
    }
    if (!openid) {
        let weChatUID = storage_privateinfo.get("wecom_touid");
        if (weChatUID) {
            openid = weChatUID;
        } else {
            openid = "@all";
        }
    }

    let response_body = http
        .post(url, {
            title: msgTitle,
            desp: msgBody + "![](https://api.ixiaowai.cn/mcapi/mcapi.php)",
            openid: openid,
        })
        .body.string();
    if (response_body.search(/SUCCESS/)) {
        toastLog("微信推送成功");
    }
}

function sendNotification(title, text, statusText, channel_id, channel_name) {
    title = arguments[0] || " ";
    text = arguments[1] || " ";
    statusText = arguments[2] || "default statusText";
    channel_id = arguments[3] || "default channel_id";
    channel_name = arguments[4] || "default channel_name";

    var manager = context.getSystemService(android.app.Service.NOTIFICATION_SERVICE);
    var notification;
    if (device.sdkInt >= 26) {
        var channel = new android.app.NotificationChannel(channel_id, channel_name, android.app.NotificationManager.IMPORTANCE_DEFAULT);
        channel.enableLights(true);
        channel.setLightColor(0xff0000);
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
        notification = new android.app.Notification.Builder(context, channel_id)
            .setContentTitle(title)
            .setContentText(text)
            .setWhen(new Date().getTime())
            .setSmallIcon(org.autojs.autojs.R.drawable.autojs_material)
            .setTicker(statusText)
            .build();
    } else {
        notification = new android.app.Notification.Builder(context)
            .setContentTitle(title)
            .setContentText(text)
            .setWhen(new Date().getTime())
            .setSmallIcon(org.autojs.autojs.R.drawable.autojs_material)
            .setTicker(statusText)
            .build();
    }
    manager.notify(0, notification);
}

//let msgid = weChatPush("wecom_secret", wecom_secret, "wecom_aid", wecom_aid, "wecom_cid", wecom_cid, "wecom_touid", wecom_touid, "content", content, "msgtype", msgtype, "imgurl", imgurl);
function weChatPush() {
    let storage_privateinfo = storages.create("privateInformation");
    let wecom_secret, wecom_aid, wecom_cid, wecom_touid, msgtype, content, title, imgurl, media_id;
    if (arguments.length == 1) {
        content = arguments[0];
    } else {
        for (let i = 0; i < arguments.length; ) {
            let elementDesc = arguments[i++];
            let element = arguments[i++];
            switch (elementDesc) {
                case "content":
                    content = element;
                    break;
                case "title":
                    title = element;
                    break;
                case "wecom_secret":
                    wecom_secret = element;
                    break;
                case "wecom_aid":
                    wecom_aid = element;
                    break;
                case "wecom_cid":
                    wecom_cid = element;
                    break;
                case "wecom_touid":
                    wecom_touid = element;
                    break;
                case "msgtype":
                    msgtype = element;
                    break;
                case "imgurl":
                    imgurl = element;
                    break;
                default:
                    console.error("invaild parament:");
                    console.trace(arguments);
            }
        }
    }

    if (!title) {
        let dateTime = new Date();
        let dateStr = dateTime.toLocaleDateString().substr(5);
        let timeStr = dateTime.toTimeString().substr(0, 5);
        if (msgtype == "markdown") {
            title = "# " + dateStr + timeStr;
        } else {
            title = dateStr + timeStr;
        }
    }
    if (!wecom_secret) {
        wecom_secret = storage_privateinfo.get("wecom_secret");
    }
    if (!wecom_aid) {
        wecom_aid = storage_privateinfo.get("wecom_aid");
    }
    if (!wecom_cid) {
        wecom_cid = storage_privateinfo.get("wecom_cid");
    }
    if (!wecom_touid) {
        wecom_touid = storage_privateinfo.get("wecom_touid");
    }
    if (!msgtype) {
        msgtype = "text";
    }
    if (!imgurl) {
        imgurl = storage_privateinfo.get("imgurl");
        if (!imgurl) {
            imgurl = "http://iw233.cn/api/Random.php";
        }
    }
    get_token_url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=" + wecom_cid + "&corpsecret=" + wecom_secret;
    response = http.get(get_token_url).body.json();
    let access_token = response["access_token"];

    if (msgtype == "image" || msgtype == "mpnews" || msgtype == "news") {
        picture = http.get(imgurl).body.bytes(); //https://acg.yanwz.cn/menhera/api.php
        files.writeBytes("./wxImg_uploadTemp.jpg", picture);
        upload_url = "https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=" + access_token + "&type=image";
        let upload_response_json = http.postMultipart(upload_url, { picture: open("./wxImg_uploadTemp.jpg") }).body.json();
        if (upload_response_json["errcode"] != 0) {
            console.error("errcode: " + upload_response_json["errcode"]);
            console.error("errmsg: " + upload_response_json["errmsg"]);
            return;
        } else {
            media_id = upload_response_json["media_id"];
        }
    }

    if (access_token.length > 0) {
        send_msg_url = "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=" + access_token;
        data = {
            touser: wecom_touid,
            agentid: wecom_aid,
            msgtype: msgtype,
            duplicate_check_interval: 600,
            text: {
                content: title + "\r\n" + content,
            },
            markdown: {
                content: title + "\r\n" + content,
            },
            image: {
                media_id: media_id,
            },
            news: {
                articles: [
                    {
                        title: title,
                        description: content,
                        url: "www.github.com",
                        picurl: imgurl, //"https://acg.yanwz.cn/menhera/api.php",
                    },
                ],
            },
            mpnews: {
                articles: [
                    {
                        title: title,
                        thumb_media_id: media_id,
                        author: "G大师",
                        content_source_url: "www.github.com",
                        content: "广告位招租",
                        digest: content,
                    },
                ],
            },
        };
        let response_body = http.postJson(send_msg_url, data).body.json();
        if (response_body["errcode"] == 0) {
            return response_body["msgid"];
        } else {
            console.error("errmsg: " + response_body["errmsg"]);
            return;
        }
    }
}
