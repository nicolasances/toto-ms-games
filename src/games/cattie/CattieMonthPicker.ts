import moment from "moment-timezone"

export class CattieMonthPicker {

    /**
     * Picks a yearMonth to use in the Cattie game
     * 
     * @param startYearMonth (string) where to start
     */
    pickMonth(startYearMonth: string): string {

        // Get Today
        const today = moment().tz("Europe/Rome")

        // Get the starting year
        const yearStart = parseInt(moment(`${startYearMonth}01`, "YYYYMMDD").format("YYYY"))

        // Define the span of years to look at 
        const yearsSpan = parseInt(today.format("YYYY")) - yearStart + 1

        // Randomly pick a year and a month
        let pickedYear = Math.floor(Math.random() * yearsSpan) + 2018
        let pickedMonth = Math.floor(Math.random() * 13)

        // Check that the year is not bigger than today's year
        if (pickedYear > parseInt(today.format("YYYY"))) pickedYear = parseInt(today.format("YYYY"))

        // Check that the month is not bigger than 12
        if (pickedMonth >= 13) pickedMonth = 12

        // Convert the month to a padded string
        let pickedMonthString = String(pickedMonth).length == 1 ? `0${String(pickedMonth)}` : String(pickedMonth)

        // Return the picked yearMonth
        return `${pickedYear}${pickedMonthString}`

    }
}