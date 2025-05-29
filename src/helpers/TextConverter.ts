export class TextConverter {
  static convertWeekdaysToShortForm(text: string): string {
    const weekdayMap: { [key: string]: string } = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };
    return Object.keys(weekdayMap).reduce(
      (str, key) => str.replace(new RegExp(key, "g"), weekdayMap[key]),
      text
    );
  }

  static convertMonthsToShortForm(text: string): string {
    const monthMap: { [key: string]: string } = {
      January: "Jan",
      February: "Feb",
      March: "Mar",
      April: "Apr",
      May: "May",
      June: "Jun",
      July: "Jul",
      August: "Aug",
      September: "Sep",
      October: "Oct",
      November: "Nov",
      December: "Dec",
    };
    return Object.keys(monthMap).reduce(
      (str, key) => str.replace(new RegExp(key, "g"), monthMap[key]),
      text
    );
  }

  static removeDuplicateAndPhrase(text: string): string {
    return text.replace(/and\s+and/g, "and").replace(/,\s*and/g, " and");
  }
}