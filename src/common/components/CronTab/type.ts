/** cron 字段选择策略 */
type CronEvery = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11"

/** 基础 cron 字段（秒/分/时/月/年共用） */
interface BaseCronField {
  cronEvery: CronEvery
  incrementStart: number
  incrementIncrement: number
  rangeStart: number
  rangeEnd: number
  specificSpecific: number[]
}

/** 天 */
interface DayCronField extends BaseCronField {
  cronDaysBeforeEomMinus: number
  cronDaysNearestWeekday: number
}

/** 周 */
interface WeekCronField {
  cronEvery: CronEvery
  incrementStart: number
  incrementIncrement: number
  specificSpecific: (string | number)[]
  cronLastSpecificDomDay: number
  cronNthDayDay: number
  cronNthDayNth: number
}

/** cron 输出结果 */
interface CronOutput {
  second: string
  minute: string
  hour: string
  day: string
  month: string
  Week: string
  year: string
}

/** 组件响应式状态 */
export interface CronTabState {
  second: BaseCronField
  minute: BaseCronField
  hour: BaseCronField
  day: DayCronField
  week: WeekCronField
  month: BaseCronField
  year: BaseCronField
  output: CronOutput
  text: CronLanguage
  secondsText: string
  minutesText: string
  hoursText: string
  daysText: string
  weeksText: string
  monthsText: string
  yearsText: string
  cron: string
}

/** 通用时间字段语言配置 */
interface TimeFieldLanguage {
  name: string
  every: string
  interval: string[]
  specific: string
  cycle: string[]
}

/** 天字段语言配置 */
interface DayFieldLanguage {
  name: string
  every: string
  intervalWeek: string[]
  intervalDay: string[]
  specificWeek: string
  specificDay: string
  lastDay: string
  lastWeekday: string
  lastWeek: string[]
  beforeEndMonth: string[]
  nearestWeekday: string[]
  someWeekday: string[]
}

/** 多语言配置 */
export interface CronLanguage {
  Seconds: TimeFieldLanguage
  Minutes: TimeFieldLanguage
  Hours: TimeFieldLanguage
  Day: DayFieldLanguage
  Week: string[]
  Month: TimeFieldLanguage
  Year: TimeFieldLanguage
  Save: string
  Close: string
}

/** 组件 Props */
export interface CronTabProps {
  cronValue?: string
  maxHeight?: string
}

/** 组件 Emits */
export interface CronTabEmits {
  (e: "change", cron: string): void
  (e: "close"): void
}
