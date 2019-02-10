var _ = require('lodash')

/**
 * Implementation of simple Hidden Markov Models
 * https://github.com/luisguiserrano/hmm
 * https://www.youtube.com/watch?v=kqSzLo9fenk
 *
 * Beware, wet code and possible errors ahead. :/
 *
 * The initial probabilities are calculated with Gaussian Elimination. This
 * implementation is not checking for pitfalls like division by zero, so can
 * easily generate Infinity and NaN, and fail miserably...
 */

Array.prototype.toTransitions = function () {
    var results = new Array();
    for (var i = 0, l = this.length - 1; i < l; i++) {
        var transition = [this[i], this[i + 1]]
        results.push(transition)
    }
    return results
}

Array.prototype.probabilityToFirst = function () {
    var clone = _.cloneDeep(this)
    var results = clone.count()

    var first = clone.map(x => [x[0]])
    firstUniquCount = first.count()
    firstUniquCountDict = _.fromPairs(firstUniquCount)

    results.forEach((v, i, a) => {
        // change count to probability
        var lastIndex = v.length - 1
        a[i][lastIndex] = v[lastIndex] / firstUniquCountDict[v[0]]
    })

    return results
}

Array.prototype.count = function () {
    var items = _.uniqWith(this, _.isEqual)

    keys = items.map(x => x.toString())
    values = _.clone(keys).fill(0)
    var hashCount = _.zipObject(keys, values);

    this.forEach(function (item) {
        hashCount[item.toString()]++
    })

    items.forEach(function (item, key, array) {
        item.push(hashCount[item.toString()])
    })

    return items
}

Array.prototype.observationProbabilities = function (observations) {
    emissions = _.slice(this, 0, this.length - 1)
    observations = _.slice(observations, 0, observations.length - 1)
    var emissObserTrans = _.zip(emissions, observations)
    var emissObserTransProba = emissObserTrans.probabilityToFirst()

    return emissObserTransProba
}

Array.prototype.last = function () {
    return this[this.length - 1]
}

// var emissions = 'SSRRRRRSSTTTTTTTSRTR'.split('')
// var emissions = 'SSRRRRSRSRSTTTTTTTSRTR'.split('')
// var emissions = 'RSSSRRRSSSRRSSSS'.split('')
var emissions = 'SSSSRRRSSSRRSSSS'.split('')
var observations = 'GHHHGGHGHHHGHHHH'.split('')
var transitions = emissions.toTransitions()
var transitionProbabilities = transitions.probabilityToFirst()
console.log(transitionProbabilities)

// x axis contains the starting labels of transitions and
// y axis contains the
var columnKeys = _.chain(transitionProbabilities).uniqBy(0).map(0).sort().value()
var rowKeys = _.chain(transitionProbabilities).uniqBy(1).map(1).sort().value()

var initialProbabilities = _.chain(rowKeys).map(rowKey => {
    var row = columnKeys.map(columnKey => {
        var cellValue = 0
        // find the current transitional probability
        var found = transitionProbabilities.filter(prob => {
            return prob[0] === columnKey && prob[1] === rowKey
        })
        if (found.length > 0) {
            cellValue = found[0].last()
            // xr + ys + zt = r <=> (x - 1)r + ys + zt = 0 and r + s + t = 1
            // xr + (y + 1)s + (z + 1)t = 1
            // so we add +1 to all probabilities except the current one
            if (columnKey !== rowKey) {
                cellValue += 1
            }
        }
        return cellValue
    })
    // 1 is the numeric result of this row, as explained in previous comment
    row.push(1)
    return [rowKey, row]
}).fromPairs().value()
// console.log(initialProbabilities)

var elimination = function (iterator) { // iterator = 'forEach' || 'forEachRight'
    // loop through columns
    _(columnKeys)[iterator]((columnKey, columnIndex) => {
        // loop through row, starting from columnIndex
        _(rowKeys).drop(columnIndex - 1)[iterator]((rowKey, rowIndex) => {
            // select the current equation
            var row = initialProbabilities[rowKey]
            var cellValue = row[columnIndex]

            var pivotRow = initialProbabilities[columnKey]
            var pivotValue = pivotRow[columnIndex]
            // our goal is
            // cellValue + multiplier * pivotValue = 0
            var multiplier = -1 * cellValue / pivotValue

            if (rowIndex - columnIndex === 0) {
                // divide all numbers of the row, so current becomes 1
                row = row.map(v => v / cellValue)
            } else {
                row = row.map((cellValue, cellIndex) => {
                    var pivotValue = pivotRow[cellIndex]
                    return cellValue + multiplier * pivotValue
                })
            }
            initialProbabilities[rowKey] = row
        })
        // console.log(initialProbabilities)
        // process.exit()
    })
}

elimination('forEach')
elimination('forEachRight')
console.log(initialProbabilities)


var sum = _.chain(initialProbabilities).toPairs().map(x => x[1].last()).sum().value()
console.log(`sum: ${sum}`)


var emissionProbabilities = emissions.observationProbabilities(observations)
console.log(emissionProbabilities)


var observations = 'HHGGGH'.split('')
var probableEmissions = []

// if (moods[0] === 'H') {
//     proba.push([i_s * e_sh, i_r * e_rh])
// } else {
//     proba.push([i_s * e_sg, i_r * e_rg])
// }
var first = rowKeys.map(rowKey => {
    var i = initialProbabilities[rowKey]
    var emProba = emissionProbabilities.filter(e => {
        return e[0] === rowKey && e[1] === observations[0]
    })[0]
    return i.last() * emProba.last()
})
probableEmissions.push(first)

for (var i = 1, l = observations.length; i < l; i++) {
    // today_sunny = Math.max(yeste_sunny * t_ss * e_sh, yeste_rainy * t_rs * e_sh)
    // today_rainy = Math.max(yeste_sunny * t_sr * e_rh, yeste_rainy * t_rr * e_rh)
    // proba.push([today_sunny, today_rainy])
    // yeste_sunny = last_proba[0]
    // yeste_rainy = last_proba[1]
    // if (moods[i] == 'H') {
    //     today_sunny = Math.max(yeste_sunny * t_ss * e_sh, yeste_rainy * t_rs * e_sh)
    //     today_rainy = Math.max(yeste_sunny * t_sr * e_rh, yeste_rainy * t_rr * e_rh)
    //     proba.push([today_sunny, today_rainy])
    // } else {
    //     today_sunny = Math.max(yeste_sunny * t_ss * e_sg, yeste_rainy * t_rs * e_sg)
    //     today_rainy = Math.max(yeste_sunny * t_sr * e_rg, yeste_rainy * t_rr * e_rg)
    //     proba.push([today_sunny, today_rainy])
    // }
    var previousProbabilities = probableEmissions.last()

    var today = rowKeys.map((rowKey1, rowIndex1) => {
        var nextProbabilities = rowKeys.map((rowKey, rowIndex) => {
            var yestSameKeyProb = previousProbabilities[rowIndex]
            var transitionProbability = transitionProbabilities.filter(x => {
                return x[0] === rowKey && x[1] === rowKey1
            })[0]
            var emissionProbability = emissionProbabilities.filter(x => {
                return x[0] === rowKey1 && x[1] === observations[i]
            })[0]
            return yestSameKeyProb * transitionProbability.last() * emissionProbability.last()
        })
        return Math.max(...nextProbabilities)
    })
    probableEmissions.push(today)
}

console.log(probableEmissions)
