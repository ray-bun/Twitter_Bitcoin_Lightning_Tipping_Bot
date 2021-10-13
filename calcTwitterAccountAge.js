function calcTwitterAccountAge(registeredDate) {
    let convertRegisteredDate = new Date(registeredDate)
    let today = new Date()
    let diff = Math.floor(today.getTime() - convertRegisteredDate.getTime());
    let day = 1000 * 60 * 60 * 24;

    let days = Math.floor(diff/day);
    // var months = Math.floor(days/31);
    // var years = Math.floor(months/12);

    // var message = date2.toDateString();
    // message += " was "
    // message += days + " days " 
    // message += months + " months "
    // message += years + " years ago \n"

    return days
    }


module.exports = calcTwitterAccountAge