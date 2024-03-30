const config = require('./config.json');

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
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
    setInterval(RequestStatus, 10 * 1000);
    allMembers()
    setInterval(allMembers, 10 * 1000);

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
            var nonFractionuserIds = new Object();
            client.guilds.cache.get(config.guildID).members.cache.map((member) => {
                if (!member.user.bot && member.roles.cache.has(config.roleID)) {
                    userIds[member.id] = member.displayName;
                }
                else if (!member.roles.cache.has(config.roleID)) {
                    nonFractionuserIds[member.id] = member.displayName;
                }
            });


            const onlineFrakcioTagok = {}
            const onlineNemFrakcioTagok = {}

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

            for (const key in nonFractionuserIds) {
                if (outputObject.hasOwnProperty(key)) {
                    onlineNemFrakcioTagok[nonFractionuserIds[key]] = outputObject[key];
                }
            }

            var nemFrakcioTagokKiiras = [];
            for (const users in onlineNemFrakcioTagok) {
                nemFrakcioTagokKiiras.push(
                    users + " | " + onlineNemFrakcioTagok[users].name + " | " + onlineNemFrakcioTagok[users].id
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

            if (frakcioTagokKiiras.length != 0) {

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
                )
            } else {
                serverStatusEmbed.addFields(
                    {
                        name: "Frakció tagok:",
                        value: "```Nincs online frakció tag!```",
                        inline: true,
                    }
                )
            }
            if (nemFrakcioTagokKiiras.length != 0) {

                serverStatusEmbed.addFields(
                    {
                        name:
                            "Nem frakció tagok: " +
                            nemFrakcioTagokKiiras.length,
                        value:
                            "```" +
                            nemFrakcioTagokKiiras.join("\n") +
                            "```",
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

async function allMembers() {

    const server = new FiveM.Server(config.serverIP, config.serverPort, 'Hiba', { timeout: 5000 })

    const fractionMembers = []
    const fractionMembersID = []

    var userData = []
    var userData2 = []

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


            let userIds = [];


            client.guilds.cache.get(config.guildID).members.cache.map((member) => {
                if (!member.user.bot && member.roles.cache.has(config.roleID)) {
                    userIds[member.id] = member.displayName;
                    fractionMembers.push(member.user.displayName + " | " + member.user.username + " | ")


                    var currentTracker = false


                    db.get('SELECT * FROM users WHERE discord = ?', [member.id], (err, row) => {
                        if (err) {
                            console.error('Error checking for existing data:', err);
                        } else if (row) {
                            console.log('Data already exists in the database');
                            currentTracker = true
                        } else {
                            // Data does not exist, so add it to the database
                            if (outputObject.hasOwnProperty(member.id)) {
                                db.run('INSERT INTO users (name, steam, discord, username) VALUES (?, ?, ?, ?)', [member.user.username, outputObject[member.id].name, member.id, member.user.displayName], function (err) {
                                    if (err) {
                                        console.error('Error adding data:', err);
                                    } else {
                                        console.log(`Data added with ID ${this.lastID}`);
                                        currentTracker = true
                                    }

                                });
                            }
                        }
                        if (!currentTracker) {
                            userData.push({
                                name: member.user.username,
                                username: member.user.displayName,
                                discord: member.id
                            })
                        } else {
                            const currentRow = row

                            if (outputObject.hasOwnProperty(currentRow['discord'])) {
                                currentRow["online"] = true
                            }

                            userData2.push(currentRow)

                        }


                    });
                }

            })


        })

    var interval = setInterval(function () {
        if (userData == [] || userData2 == []) {
            //Do Something While Waiting / Spinner Gif etc.
        } else {
            clearInterval(interval);
            setKiiras()
        }
    }, 1000);

    var userDataMain
    var frakcioMembersKiiras = []

    function setKiiras() {

        userData.sort((a, b) => {
            // Convert discord IDs to numbers for proper comparison
            const discordA = parseInt(a.discord);
            const discordB = parseInt(b.discord);
            return discordA - discordB;
        });

        userDataMain = [...userData2, ...userData]

        console.log(userDataMain)

        for (const data of userDataMain) {
            let kiiras
            if (data.hasOwnProperty('steam')) {
                kiiras = "<@"+data["discord"]  + ">" + " | " + data["steam"]
                if (data.hasOwnProperty('online')) {
                    kiiras += " | ✅"
                }

            } else {
                kiiras = "<@"+data["discord"]  + ">"
            }
            frakcioMembersKiiras.push(kiiras)
        }
        console.log(frakcioMembersKiiras)

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('Frakció Tagok:')
            .setAuthor({ name: client.user.displayName, iconURL: client.user.displayAvatarURL(), })
            .setDescription("**Discord | Steam | Online?**" + "\n" + frakcioMembersKiiras.join("\n") + '')
            .setTimestamp()

        const channel = client.channels.cache.get(config.tagokChannel)


        channel.messages.fetch({ limit: 10 }).then((messages) => {
            if (messages.size === 0) {
                channel.send({ embeds: [embed] })
            } else {
                messages.forEach((message) => {
                    if (message.author.id === client.user.id) {
                        message.edit({ embeds: [embed] });
                    } else {
                        if (message.deletable) message.delete();
                    }
                });
            }
        })
    }









}

const DB_FILE = 'database.db';

// Check if the database file exists
const dbExists = fs.existsSync(DB_FILE);

// Create a new database connection
const db = new sqlite3.Database(DB_FILE);

// If the database doesn't exist, create a new one
if (!dbExists) {
    console.log('Creating new database...');

    // Perform database initialization tasks here, such as creating tables
    db.serialize(() => {
        db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, steam TEXT, discord TEXT, username TEXT)');
    });

    console.log('New database created.');
} else {
    console.log('Database loaded.');
}



client.login(config.token);