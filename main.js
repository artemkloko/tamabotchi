class Ui {
    constructor() {
        let dum = {
            loading: {
                tagName: "div",
                innerText: "Loading..."
            },
            chat: {
                tagName: 'div',
                children: {
                    history: {
                        tagName: "div"
                    },
                    request: {
                        tagName: "div",
                        children: {
                            input: {
                                tagName: "input",
                                type: "text"
                            },
                            button: {
                                tagName: "button",
                                innerText: "send"
                            }
                        }
                    }
                }
            }
        }
        this.createDum(dum, document.querySelector('body'))
    }

    createDum(dum, parent) {
        for (let id in dum) {
            let dumNode = dum[id]
            let el = document.createElement(dumNode.tagName)
            el.id = (parent.id !== '' ? parent.id + '_' : '') + id
            for (let property in dumNode) {
                let value = dumNode[property]
                if (typeof value === 'string') {
                    try {
                        el[property] = value
                    } catch (e) { }
                }
            }
            if (typeof dumNode.children === 'object') {
                this.createDum(dumNode.children, el)
            }
            parent.appendChild(el)
        }
    }

    show(query) {
        let el = document.querySelector(query)
        for (let sibling of el.parentElement.children) {
            sibling.style = 'display: ' + (sibling === el ? 'block' : 'none') + ';'
        }
    }

    element(query) {
        return document.querySelector(query)
    }

    addHistory(content) {
        let dum = {}
        dum[new Date()] = {
            tagName: 'div',
            innerText: content
        }
        this.createDum(dum, this.element('#chat_history'))
    }
}

let main = function () {
    let webWorker = new Worker('web-worker.js')
    let ui = new Ui()
    ui.show('#loading')

    let request = function (event) {
        let value = ui.element('#chat_request_input').value
        ui.addHistory(`you: ${value}`)
        webWorker.postMessage({ key: 'request', value: value })
        ui.element('#chat_request_input').value = ''
    }

    let receive = function (event) {
        if (event.data.key === 'ready' && event.data.value) {
            ui.show('#chat')
        } else if (event.data.key === 'response') {
            ui.addHistory(`tamabotchi: ${event.data.value}`)
        }
    }

    ui.element('#chat_request_button').addEventListener('click', request)

    ui.element('#chat_request_input').onkeydown = function (event) {
        if (event.key === 'Enter') {
            request(event)
        }
    }

    webWorker.onmessage = receive

    webWorker.postMessage({ key: 'ready' })
}

document.addEventListener("DOMContentLoaded", main)
