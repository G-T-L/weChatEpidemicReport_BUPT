//作者: G大师
//推荐自动熄屏时间2min起

auto();
auto.waitFor();
let chargedCounts = 0;
let couponsCollected = 0;
let totalChargedCounts = 0;
let totalCouponsCollected = 0;
var toChargeCounts = 99; //by default
var debugMode = false; //enable to quickly go through sections
var deviceUnlocker = require("解锁屏幕.js");
var isScreenNeedToBeLocked;
var thread_main;
var thread_main_monitor;
let storage = storages.create("aliCardCharge");
let storage_privateinfo = storages.create("privateInformation");
var paymentCode = storage_privateinfo.get("AlipayPaymentCode"); //var paymentCode = [1, 2, 3, 4, 5, 6]; //替换示例 请自行修改密码

if (storage.get("lastRanDate") == new Date().getDate()) {
    log("first run this day");
    totalChargedCounts = storage.get("totalChargedCounts");
    totalCouponsCollected = storage.get("totalCouponsCollected");
} else {
    storage.put("totalChargedCounts", 0);
    storage.put("totalCouponsCollected", 0);
    storage.put("lastRanDate", new Date().getDate());
}
unlockAndEnterMainSession();
thread_main_monitor = threads.start(thread_main_monitor_enable);

/**
thread_main_acc = threads.start(function () {
    while (true) {
        if (text("充值成功").findOne(1000)) {
            smartClick(text("完成").findOne(1000));
        }
    }
});
 */

function cardCharge() {
    launchApp("支付宝");

    for (var i = 0; i < 5; i++) {
        if (!text("口碑").findOne(1000)) {
            back();
            sleep(1000);
        }
    }

    sleep(1000);
    smartClick(text("首页").findOne(3000));
    text("卡包").findOne(30 * 1000);
    sleep(1000);

    smartClick(idContains("home_title_search_hint").findOne(3000));
    text("搜索").findOne(30 * 1000);
    sleep(1000);
    idContains("search_input_box").findOne(3000).setText("校园一卡通");
    sleep(100);
    smartClick(text("搜索").findOne(3000));
    text("全部").findOne(30 * 1000);
    sleep(3000);
    smartClick(className("android.widget.TextView").text("校园一卡通").findOne(1000));
    sleep(3000);

    if (debugMode) {
        toChargeCounts = 3;
    } else {
        toChargeCounts = 99 - totalChargedCounts;
    }
    toastLog("rounds left: " + toChargeCounts.toString());
    for (let round = 0; round < toChargeCounts; round++) {
        toastLog("current charge round: " + round.toString());
        if (!text("校园派·一卡通").findOne(10 * 1000)) {
            for (let i = 0; i < 10 && !text("校园派·一卡通").findOne(10 * 1000); i++) {
                if (className("android.widget.TextView").text("校园一卡通").findOne(1000)) {
                    smartClick(className("android.widget.TextView").text("校园一卡通").findOne(1000));
                    sleep(10 * 1000);
                } else {
                    back();
                    sleep(1000);
                }
            }
        }
        sleep(3000);

        smartClick(text("充值").findOne(1000));
        if (!text("手动输入").findOne(10 * 1000)) {
            console.trace("round%d failed at : ", round);
            continue;
        }
        sleep(1000);

        smartClick(text("手动输入").findOne(1000));
        text("请输入金额").findOne(10 * 1000);
        sleep(100);

        text("请输入金额").findOne(1000).parent().child(1).setText("1");
        sleep(1000);
        smartClick(text("确定").findOne(3000));
        if (!text("订单信息").findOne(10 * 1000)) {
            console.trace("round%d failed at : ", round);
            continue;
        }
        sleep(100);

        smartClick(text("使用密码").findOne(3000));
        if (!text("请输入支付密码").findOne(10 * 1000)) {
            console.trace("round%d failed at : ", round);
            continue;
        }
        sleep(1000);

        for (let i = 0; i < paymentCode.length; i++) {
            smartClick(text(paymentCode[i]).findOne(1000));
        }

        if (text("充值成功").findOne(10 * 1000)) {
            chargedCounts++;
            totalChargedCounts++;
            storage.put("totalChargedCounts", totalChargedCounts);
        }
        sleep(2000);
        smartClick(text("完成").findOne(3000));
        sleep(1000);
    }

    sleep(3000);
    if (!text("校园派·一卡通").findOne(10 * 1000)) {
        for (let i = 0; i < 10 && !text("校园派·一卡通").findOne(10 * 1000); i++) {
            if (className("android.widget.TextView").text("校园一卡通").findOne(1000)) {
                smartClick(className("android.widget.TextView").text("校园一卡通").findOne(1000));
                sleep(10 * 1000);
            } else {
                back();
                sleep(1000);
            }
        }
    }

    sleep(3000);
    smartClick(textContains("天天充值券").findOne(3000));
    sleep(3000);
    textContains("领取 x").findOne(10 * 1000);
    if (!textContains("做充值任务").findOne(1000)) {
        sleep(3000);
        let myreg = new RegExp("\\d{1,3}", "g");
        let regArray = myreg.exec(textContains("领取 x").findOne(1000).text());
        let coupons = parseInt(regArray[0] / 3);
        for (let i = 0; i < coupons; i++) {
            smartClick(textContains("领取 x").findOne(1000));
            sleep(100);
            if (textContains("继续领券").findOne(1000)) {
                couponsCollected++;
                totalCouponsCollected++;
                storage.put("totalCouponsCollected", totalCouponsCollected);
            }
            smartClick(textContains("继续领券").findOne(1000));
            sleep(100);
            smartClick(textContains("知道了").findOne(100));
        }
    }
    for (let i = 0; i < 20; i++) {
        if (!text("口碑").findOne(1000)) {
            back();
            sleep(100);
        }
    }
    home();
    weChatPush(
        "充饭卡简报\n此次充值次数：" +
            chargedCounts.toString() +
            "\n此次红包领取数：" +
            couponsCollected.toString() +
            "\n今日累计充值次数： " +
            totalChargedCounts.toString() +
            "\n今日累计红包领取数： " +
            totalCouponsCollected.toString()
    );
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
}

function smartClick(widget) {
    if (widget) {
        if (widget.clickable()) {
            widget.click();
            sleep(100);
            return true;
        } else {
            var widget_temp = widget.parent();
            for (var triedTimes = 0; triedTimes < 5; triedTimes++) {
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

function thread_main_monitor_enable() {
    log("防超时定时器已启动");
    for (var i = 0; i < 2 * 60 * 60; i++) {
        sleep(1000);
    }
    if (thread_main) {
        // 如果取消了此次脚本 则thread_main为空
        thread_main.interrupt();

        console.error("支付宝充饭卡脚本超时");
        weChatPush("支付宝充饭卡已超时！\n充值次数：" + chargedCounts.toString() + "\n红包领取数：" + couponsCollected.toString());
        if (isScreenNeedToBeLocked) {
            for (let i = 0; i < 2 * 60; i++) {
                if (device.isScreenOn()) {
                    sleep(1000);
                }
            }
            device.setBrightnessMode(1); //改回自动亮度
            //KeyCode(26);
        }
        alert("支付宝充饭卡脚本超时,请联系作者");
        app.startActivity({
            action: "android.intent.action.VIEW",
            data: "mqq://im/chat?chat_type=wpa&version=1&src_type=web&uin=673193983",
            packageName: "com.tencent.mobileqq",
        });
    }
}

function unlockAndEnterMainSession() {
    if (device.isScreenOn()) {
        isScreenNeedToBeLocked = false;
        var actionSlected = false;
        var dialog_start = dialogs
            .build({
                title: "是否充值饭卡?",
                positive: "确认",
                negative: "取消",
                neutral: "充值次数",
                checkBoxPrompt: "调试",
                checkBoxChecked: false,
            })
            .on("any", (action, dialog) => {
                actionSlected = true;
                if (action == "positive") {
                    thread_main = threads.start(cardCharge);
                } else if (action == "negative") {
                    toast("此次脚本已取消");
                    console.info("opration aborted mannually");
                    exit();
                } else if (action == "neutral") {
                    toChargeCounts = dialogs.input("充值次数:", "3");
                    thread_main = threads.start(cardCharge);
                }
            })
            .on("dismiss", (dialog) => {
                if (!actionSlected) {
                    //未选择选项直接点击屏幕外解散对话框则默认延时
                    toastLog("延时5分钟");
                    sleep(5 * 60 * 1000);
                    unlockAndEnterMainSession();
                }
            })
            .on("check", (checked) => {
                // 监听勾选框   但无动作则不执行  即采用默认值
                debugMode = checked;
                toastLog("Debug Mode ： " + debugMode);
            });

        dialog_start.show();
    } else {
        isScreenNeedToBeLocked = true;
        device.setBrightnessMode(0);
        device.setBrightness(0);
        if (deviceUnlocker.unlockDevice()) {
            thread_main = threads.start(cardCharge);
        } else {
            alert("解锁屏幕失败！");
            exit();
        }
    }
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
