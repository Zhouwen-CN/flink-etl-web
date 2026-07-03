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
}

/** 组件响应式状态 */
export interface CronTabState {
  second: BaseCronField
  minute: BaseCronField
  hour: BaseCronField
  day: DayCronField
  week: WeekCronField
  month: BaseCronField
  output: CronOutput
  secondsText: string
  minutesText: string
  hoursText: string
  daysText: string
  weeksText: string
  monthsText: string
  cron: string
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
