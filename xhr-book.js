class XhrBook {

    static async create(src) {
        const instance = new XhrBook();
        await instance.load(src);
        return instance;
    }

    async load(src) {
        let instance = this
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        instance.text = xhr.responseText
                        resolve();
                    } else {
                        reject(xhr);
                    }
                }
            };
            xhr.open("GET", src);
            xhr.send();
        });
    }

    async readNextSentence() {
        let nextStop = this.text.indexOf('.', this.hasReadUntil)
        let sentence = this.text.slice(this.hasReadUntil, nextStop)
        nextStop++
        this.hasReadUntil = nextStop
        console.log(`read about ${Math.round(100 * this.hasReadUntil / this.text.length)}%`);
        return sentence
    }
}