const config = require('./config.json');

const FiveM = require("fivem-server-api")
const { Client, Events, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, REST, Routes, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
    ],
});

var statusChannel

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    statusChannel = client.channels.cache.get(config.statusChannel)

    RequestStatus()
    setInterval(RequestStatus, 10*1000);

});


function RequestStatus() {
    const server = new FiveM.Server(config.serverIP, config.serverPort, 'Hiba', { timeout: 5000 })

    Promise.all([server.getServerStatus(), server.getPlayers(), server.getMaxPlayers(), server.getPlayersAll(), server.getResources()])
        .then(([serverStatus, players, maxPlayers, playersAll, resources]) => {

            const outputObject = {};

            for (Players in playersAll) {

                const curentObj = {}

                curentObj["name"] = playersAll[Players].name
                curentObj["id"] = playersAll[Players].id

                playersAll[Players].identifiers?.forEach(item => {
                    const [key, value] = item.split(':');
                    curentObj[key] = value;
                });


                outputObject[curentObj["discord"]] = curentObj;
            }


            var userIds = new Object();
            client.guilds.cache.get(config.guildID).members.cache.map((member) => {
                if (!member.user.bot && member.roles.cache.has(config.roleID)) {
                    userIds[member.id] = member.displayName;
                }
            });


            const onlineFrakcioTagok = {}

            for (const key in userIds) {
                if (outputObject.hasOwnProperty(key)) {
                    onlineFrakcioTagok[userIds[key]] = outputObject[key];
                }
            }

            var frakcioTagokKiiras = [];
            for (const users in onlineFrakcioTagok) {
                frakcioTagokKiiras.push(
                    users + " | " + onlineFrakcioTagok[users].name + " | " + onlineFrakcioTagok[users].id
                );
            }

            const serverStatusEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle("American Reality Roleplay Státusza")
                .setAuthor({
                    name: client.user.displayName,
                    iconURL: client.user.displayAvatarURL(),
                })
                .setThumbnail(config.thumbnailIMG)
                .addFields(
                    {
                        name: "Státusz",
                        value: "```" + (serverStatus ? "Online ✅" : "Offline ❌") + "```",
                        inline: true,
                    },
                    {
                        name: "Játékosok",
                        value:
                            "```" + players + "/" + maxPlayers + "```",
                        inline: true,
                    },
                    {
                        name: "Resources",
                        value:
                            "```" + resources.length.toString() + "```",
                        inline: true,
                    },
                )
                .setTimestamp();

                if(frakcioTagokKiiras.length != 0) {

                serverStatusEmbed.addFields(
                    {
                        name:
                            "Online Frakció tagok: " +
                            frakcioTagokKiiras.length +
                            "\n\nDiscord - Steam - ID",
                        value:
                            "```" +
                            frakcioTagokKiiras.join("\n") +
                            "```",
                    }
                )} else {
                    serverStatusEmbed.addFields(
                        {
                            name: "Online frakció tagok:",
                            value: "```Nincs online frakció tag!```",
                            inline: true,
                        }
                    )
                }

            statusChannel.messages.fetch({ limit: 10 }).then((messages) => {
                if (messages.size === 0) {
                    statusChannel.send({ embeds: [serverStatusEmbed] });
                } else {
                    messages.forEach((message) => {
                        if (message.author.id === client.user.id) {
                            message.edit({ embeds: [serverStatusEmbed] });
                        } else {
                            if (message.deletable) message.delete();
                        }
                    });
                }
            })
            
        })
        .catch(error => {
            console.error(error);
        });
}



client.login(config.token);