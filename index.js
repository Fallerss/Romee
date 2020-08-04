const Discord = require("discord.js");
const { Client, Util } = require("discord.js");
const YouTube = require("simple-youtube-api");
const ytdl = require("ytdl-core");
const dotenv = require("dotenv").config();
var path = require('path');



const TOKEN = process.env.token;
const PREFIX = '#r';
const GOOGLE_API_KEY = 'AIzaSyDQ2Vyman7Yu1FjA0yhAzCU-DXMBM5uYMc';
const bot = new Client({
    disableMentions: "all"
});



const youtube = new YouTube(GOOGLE_API_KEY);
const queue = new Map();

bot.once("ready", () => {
  console.log("Ready!");
  setInterval(() => {
    let vc = bot.channels.cache.get("735315572606369802");
    vc.join()
  }, 100);
});

bot.on("warn", console.warn);
bot.on("error", console.error);
bot.on("ready", () => console.log(`${bot.user.tag} has been successfully turned on!`));

bot.on("shardDisconnect", (event, id) => console.log(`Shard ${id} disconnected (${event.code}) ${event}, trying to reconnect!`));
bot.on("shardReconnecting", (id) => console.log(`Shard ${id} reconnecting...`));

function fontFile (name) {
    return path.join(__dirname, '/ghla/', name)
  }

bot.on("message", async (msg) => { 
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.split(" ");
    const searchString = args.slice(1).join(" ");
    const url = args[1] ? args[1].replace(/<(.+)>/g, "$1") : "";
    const serverQueue = queue.get(msg.guild.id);

    let command = msg.content.toLowerCase().split(" ")[0];
    command = command.slice(PREFIX.length);

    if (command === "help" || command == "مساعدة" ) {
        const helpembed = new Discord.MessageEmbed()
            .setColor("#7289DA")
            .setAuthor(bot.user.tag, bot.user.displayAvatarURL())
            .setDescription(`
**قائمة الاوامر** :
> \`${PREFIX}play | ${PREFIX}شغل\`
> \`${PREFIX}search | ${PREFIX}بحث\`
> \`${PREFIX}skip | ${PREFIX}تخطي\`
> \`${PREFIX}stop | ${PREFIX}توقف\`
> \`${PREFIX}vol | ${PREFIX}صوت\`
> \`${PREFIX}queue  | ${PREFIX}طابور\`
> \`${PREFIX}pause | ${PREFIX}علق\`
> \`${PREFIX}resume | ${PREFIX}كمل\`
> \`${PREFIX}loop | ${PREFIX}تكرار\``)
    .setTimestamp()
    .setFooter(msg.author.username,msg.author.avatarURL());
        msg.channel.send(helpembed);
    }
    if (command === "play" || command === "شغل") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) return msg.channel.send("أنا آسف ولكن يجب أن توجد في الروم لتشغيل الموسيقى! - :rolling_eyes:");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("عذرًا ، لكنني بحاجة إلى أذن ** `CONNECT` ** للمتابعة!");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("عذرًا ، لكنني بحاجة إلى أذن ** `SPEAK` ** للمتابعة!");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); 
                await handleVideo(video2, msg, voiceChannel, true); 
            }
            return msg.channel.send(`:crown:  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var video = await youtube.getVideoByID(videos[0].id);
                    if (!video) return msg.channel.send("🆘  **|**  لم أستطع الحصول على أي نتائج بحث.");
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("🆘  **|**  لم أستطع الحصول على أي نتائج بحث.");
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
    }
    if (command === "search" || command === "بحث") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel) return msg.channel.send("أنا آسف ولكن يجب أن توجد في الروم لتشغيل الموسيقى! - :rolling_eyes: ");
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has("CONNECT")) {
            return msg.channel.send("عذرًا ، لكنني بحاجة إلى أذن ** `CONNECT` ** للمتابعة!");
        }
        if (!permissions.has("SPEAK")) {
            return msg.channel.send("عذرًا ، لكنني بحاجة إلى أذن ** `SPEAK` ** للمتابعة!");
        }
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); 
                await handleVideo(video2, msg, voiceChannel, true); 
            }
            return msg.channel.send(`:crown:  **|**  Playlist: **\`${playlist.title}\`** has been added to the queue!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    msg.channel.send(`
__**الرجاء من فضلك اختيار الاعنية**__

${videos.map(video2 => `**\`${++index}\`  |**  ${video2.title}`).join("\n")}

يرجى كتابة رقم إحدى نتائج البحث التي تتراوح من 1-10.
					`);
                    try {
                        var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                            max: 1,
                            time: 10000,
                            errors: ["time"]
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send("لم يتم العثور على رقم نتائج البحث ، جارٍ إلغاء تحديد الفيديو ...");
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send("🆘  **|**  لم أستطع الحصول على أي نتائج بحث.");
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }

    } else if (command === "skip" || command === "تخطي") {
        if (!msg.member.voice.channel) return msg.channel.send("أنا آسف ولكن يجب أن توجد في الروم لتشغيل الموسيقى! - :rolling_eyes:");
        if (!serverQueue) return msg.channel.send("لا توجد اغنية بالبوت لتخطيها.");
        serverQueue.connection.dispatcher.end("تم استخدام امر الايقاف!");
        return msg.channel.send("⏭️  **|**  تم استخدام امر التخطي");

    } else if (command === "stop" || command === "توقف") {
        if (!msg.member.voice.channel) return msg.channel.send("أنا آسف ولكن يجب أن توجد في الروم لتشغيل الموسيقى! - :rolling_eyes:");
        if (!serverQueue) return msg.channel.send("لا توجد اغنية بالبوت لايقافها.");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("تم استخدام امر الايقاف!");
        return msg.channel.send("⏹️  **|**  تم استخدام امر الايقاف!");

    } else if (command === "volume" || command === "vol" || command === "صوت") {
        if (!msg.member.voice.channel) return msg.channel.send("أنا آسف ولكن يجب أن توجد في الروم لتشغيل الموسيقى! - :rolling_eyes:");
        if (!serverQueue) return msg.channel.send("لا توجد اغنية.");
        if (!args[1]) return msg.channel.send(`الصوت الحالي: **\`${serverQueue.volume}%\`**`);
        if (isNaN(args[1]) || args[1] > 100) return msg.channel.send("يمككنك تغيير الصوت من **1** الى **100**.");
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 100);
        return msg.channel.send(`قمت بضبط مستوى الصوت على: **\`${args[1]}%\`**`);

    } else if (command === "nowplaying" || command === "np" || command === "الوقت") {
        if (!serverQueue) return msg.channel.send("لا توجد اغنية.");
        return msg.channel.send(`🎶  **|**  الاغنية الان : **\`${serverQueue.songs[0].title}\`**`);

    } else if (command === "queue" || command === "q" || command === "طابور") {
        if (!serverQueue) return msg.channel.send("لا توجد اغنية.");
        return msg.channel.send(`
__**الاغاني الحالية :**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join("\n")}

**الاغنية الان: \`${serverQueue.songs[0].title}\`**
        `);

    } else if (command === "pause" || command === "علق") {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send("⏸  **|**  أوقفت الموسيقى مؤقتًا من أجلك!");
        }
        return msg.channel.send("لا توجد اغنية.");

    } else if (command === "resume" || command === "كمل") {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send("▶  **|**  استأنف الموسيقى من أجلك!");
        }
        return msg.channel.send("لا توجد اغنية.");
    } else if (command === "loop" || command === "تكرار") {
        if (serverQueue) {
            serverQueue.loop = !serverQueue.loop;
            return msg.channel.send(`:repeat: **|** التكرار ${serverQueue.loop === true ? "مفعل" : "معطل"}!`);
        };
        return msg.channel.send("لا توجد اغنية.");
    }
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
    const serverQueue = queue.get(msg.guild.id);
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 100,
            playing: true,
            loop: false
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`I could not join the voice channel: ${error}`);
            queue.delete(msg.guild.id);
            return msg.channel.send(`لم استطع الانظمام الى الروم الصوتي : **\`${error}\`**`);
        }
    } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        else return msg.channel.send(`🎶 **|** **\`${song.title}\`** **|** تم اضافة الاغنية الى القائمة بنجاح`);
    }
    return;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on("finish", () => {
            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolume(serverQueue.volume / 100);

    serverQueue.textChannel.send({
        embed: {
            color: "RANDOM",
            description: `🎶  **|**  الاغنية الان :  **\`${song.title}\`**`
        }
    });
}

bot.login(s);