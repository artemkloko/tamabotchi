
let { appendFile, readFile } = require('fs')
let { promisify } = require('util')

let SlackBot = require('slackbots')

let config = require('./config')
let Tamabotchi = require('./tamabotchi')

let startBot = async function () {
    return new Promise(function (resolve, reject) {
        let bot = new SlackBot({
            token: config.slack_token,
            name: config.slack_name
        })

        bot.on('start', function () {
            try {
                let user = bot.users.filter(function (user) {
                    return user.name === bot.name
                })[0]
                bot.id = user.id
                console.log(`id: ${bot.id}`)
                resolve(bot)
            } catch (error) {
                reject(error)
            }
        })
    })
}

let main = async function () {
    let bot
    let tamabotchi

    let respond = async function (response, message) {
        if (message.inChannelBots) {
            let channel = bot.channels.filter(function (item) {
                return item.id === message.channel
            })[0]
            bot.postMessageToChannel(channel.name, response, { as_user: true })
        } else if (message.inDirectMessage) {
            let user = bot.users.filter(function (item) {
                return item.id === message.user
            })[0]
            bot.postMessageToUser(user.name, response, { as_user: true })
        }
    }

    let receive = async function (message) {
        let response

        try {
            if (message.type !== 'message' ||
                typeof message.text !== 'string' ||
                message.user === bot.id) {
                return
            }

            message.inChannelBots = message.channel === 'CER5J71LY'
            message.inDirectMessage = message.channel[0] === 'D'
            message.hasMention = message.text.indexOf(`<@${bot.id}>`) > -1

            if (message.text.split(/\s+/g).indexOf('stats') > -1 &&
                (message.inDirectMessage || message.hasMention)) {
                var stats = tamabotchi.markovTable.stats()
                stats.memoryUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + '/' +
                    Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
                return respond(JSON.stringify(stats), message)
            }

            let messageClean = message.text.replace(new RegExp(`<@${bot.id}>`, 'g'), `<@self>`)
            tamabotchi.learn(messageClean)
            await promisify(appendFile)('books/history.txt', messageClean + '�')

            if (message.inChannelBots && message.hasMention) {
                // pass
                // } else if (message.inChannelBots && (Math.random() > 0.8)) {
                // pass
            } else if (message.inDirectMessage) {
                // pass
            } else {
                return
            }

            messageClean = message.text.replace(new RegExp(`<@${bot.id}>`, 'g'), '')
            response = await tamabotchi.saySomething(messageClean)
            response = response.replace(/\<\@self\>/g, `<@${message.user}>`)
        } catch (error) {
            console.error(error)
            response = 'I am broken...'
        } finally {
            respond(response, message)
        }
    }

    try {
        tamabotchi = new Tamabotchi(3)

        let books = [
            'books/history.txt',
            // 'books/de-sade-bedroom.txt',
            // 'books/Economic-Philosophic-Manuscripts-1844.txt',
            // 'books/function_of_the_orgasm.txt',
            // 'books/guy-debord-the-society-of-the-spectacle.txt',
            // 'books/naked-lunch.txt',
            // 'books/patience-and-sarah.txt',
            // 'books/what-itd.txt'
        ]
        for (let bookSrc of books) {
            let content = await promisify(readFile)(bookSrc, 'utf-8')
            for (let sentence of content.split(/[.�]/)) {
                await tamabotchi.learn(sentence)
            }
            console.log(`read ${bookSrc}`)
        }
        bot = await startBot()
        bot.on('message', receive)
    } catch (error) {
        console.error(error)
    }
}

main()
