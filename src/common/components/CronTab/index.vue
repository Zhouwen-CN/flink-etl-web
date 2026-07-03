<script setup lang="ts">
import type { CronTabState } from "./type"
import { computed, reactive, watch } from "vue"

defineOptions({ name: "NoVue3Cron" })

const props = defineProps<{
  cronValue?: string
  maxHeight?: string
}>()

const emit = defineEmits<{
  (e: "change", cron: string): void
  (e: "close"): void
}>()

const state: CronTabState = reactive({
  second: {
    cronEvery: "1",
    incrementStart: 0,
    incrementIncrement: 5,
    rangeStart: 0,
    rangeEnd: 0,
    specificSpecific: []
  },
  minute: {
    cronEvery: "1",
    incrementStart: 0,
    incrementIncrement: 5,
    rangeStart: 0,
    rangeEnd: 0,
    specificSpecific: []
  },
  hour: {
    cronEvery: "1",
    incrementStart: 0,
    incrementIncrement: 5,
    rangeStart: 0,
    rangeEnd: 0,
    specificSpecific: []
  },
  day: {
    cronEvery: "1",
    incrementStart: 1,
    incrementIncrement: 1,
    rangeStart: 0,
    rangeEnd: 0,
    specificSpecific: [],
    cronDaysBeforeEomMinus: 0,
    cronDaysNearestWeekday: 0
  },
  week: {
    cronEvery: "1",
    incrementStart: 1,
    incrementIncrement: 1,
    specificSpecific: [],
    cronLastSpecificDomDay: 1,
    cronNthDayDay: 1,
    cronNthDayNth: 1
  },
  month: {
    cronEvery: "1",
    incrementStart: 1,
    incrementIncrement: 1,
    rangeStart: 0,
    rangeEnd: 0,
    specificSpecific: []
  },
  output: {
    second: "",
    minute: "",
    hour: "",
    day: "",
    month: "",
    Week: ""
  },
  secondsText: computed(() => {
    let seconds = ""
    const cronEvery = state.second.cronEvery
    switch (cronEvery.toString()) {
      case "1":
        seconds = "*"
        break
      case "2":
        seconds
          = `${state.second.incrementStart
          }/${
            state.second.incrementIncrement}`
        break
      case "3":
        state.second.specificSpecific.forEach((val) => {
          seconds += `${val},`
        })
        seconds = seconds.slice(0, -1)
        break
      case "4":
        seconds = `${state.second.rangeStart}-${state.second.rangeEnd}`
        break
    }
    return seconds
  }),
  minutesText: computed(() => {
    let minutes = ""
    const cronEvery = state.minute.cronEvery
    switch (cronEvery.toString()) {
      case "1":
        minutes = "*"
        break
      case "2":
        minutes
          = `${state.minute.incrementStart
          }/${
            state.minute.incrementIncrement}`
        break
      case "3":
        state.minute.specificSpecific.forEach((val) => {
          minutes += `${val},`
        })
        minutes = minutes.slice(0, -1)
        break
      case "4":
        minutes = `${state.minute.rangeStart}-${state.minute.rangeEnd}`
        break
    }
    return minutes
  }),
  hoursText: computed(() => {
    let hours = ""
    const cronEvery = state.hour.cronEvery
    switch (cronEvery.toString()) {
      case "1":
        hours = "*"
        break
      case "2":
        hours
          = `${state.hour.incrementStart}/${state.hour.incrementIncrement}`
        break
      case "3":
        state.hour.specificSpecific.forEach((val) => {
          hours += `${val},`
        })
        hours = hours.slice(0, -1)
        break
      case "4":
        hours = `${state.hour.rangeStart}-${state.hour.rangeEnd}`
        break
    }
    return hours
  }),
  daysText: computed(() => {
    let days = ""
    const cronEvery = state.day.cronEvery
    switch (cronEvery.toString()) {
      case "1":
        break
      case "3":
        days
          = `${state.day.incrementStart}/${state.day.incrementIncrement}`
        break
      case "4":
        days = `${state.day.rangeStart}-${state.day.rangeEnd}`
        break
      case "5":
        state.day.specificSpecific.forEach((val) => {
          days += `${val},`
        })
        days = days.slice(0, -1)
        break
    }
    return days
  }),
  weeksText: computed(() => {
    let weeks = ""
    const cronEvery = state.week.cronEvery
    switch (cronEvery.toString()) {
      case "1":
      case "3":
      case "5":
        weeks = "?"
        break
    }
    return weeks
  }),
  monthsText: computed(() => {
    let months = ""
    const cronEvery = state.month.cronEvery
    switch (cronEvery.toString()) {
      case "1":
        months = "*"
        break
      case "2":
        months
          = `${state.month.incrementStart}/${state.month.incrementIncrement}`
        break
      case "3":
        state.month.specificSpecific.forEach((val) => {
          months += `${val},`
        })
        months = months.slice(0, -1)
        break
      case "4":
        months = `${state.month.rangeStart}-${state.month.rangeEnd}`
        break
    }
    return months
  }),
  cron: computed(() => {
    const seconds = state.secondsText || "*"
    const minutes = state.minutesText || "*"
    const hours = state.hoursText || "*"
    const days = state.daysText || "*"
    const months = state.monthsText || "*"
    const weeks = state.weeksText || "?"
    const isSet = (val: string) => val !== "*" && val !== "?" && val !== ""
    const minuteSet = isSet(minutes)
    const hourSet = isSet(hours)
    const dayOrWeekSet = isSet(days) || isSet(weeks)
    const monthSet = isSet(months)
    const finalSecond = seconds === "*" && (minuteSet || hourSet || dayOrWeekSet || monthSet) ? "0" : seconds
    const finalMinute = minutes === "*" && (hourSet || dayOrWeekSet || monthSet) ? "0" : minutes
    const finalHour = hours === "*" && (dayOrWeekSet || monthSet) ? "0" : hours
    return `${finalSecond} ${finalMinute} ${finalHour} ${days} ${months} ${weeks}`
  })
})

watch(() => props.cronValue, (newCron: string | undefined) => {
  if (typeof (newCron) !== "string" || !newCron) return
  const crons = newCron.split(" ")
  // 解析 seconds
  const secondsText = crons[0].trim()
  if (secondsText === "*") {
    state.second.cronEvery = "1"
  } else if (secondsText.includes("/")) {
    state.second.cronEvery = "2"
    const secondsTexts = secondsText.split("/")
    state.second.incrementStart = Number.parseInt(secondsTexts[0])
    state.second.incrementIncrement = Number.parseInt(secondsTexts[1])
  } else if (secondsText.includes(",") || Number.isFinite(Number(secondsText))) {
    state.second.cronEvery = "3"
    state.second.specificSpecific = secondsText.split(",").map(item => Number.parseInt(item))
  } else if (secondsText.includes("-")) {
    state.second.cronEvery = "4"
    const secondsTexts = secondsText.split("-")
    state.second.rangeStart = Number.parseInt(secondsTexts[0])
    state.second.rangeEnd = Number.parseInt(secondsTexts[1])
  }
  // 解析 minutes
  const minutesText = crons[1].trim()
  if (minutesText === "*") {
    state.minute.cronEvery = "1"
  } else if (minutesText.includes("/")) {
    state.minute.cronEvery = "2"
    const minutesTexts = minutesText.split("/")
    state.minute.incrementStart = Number.parseInt(minutesTexts[0])
    state.minute.incrementIncrement = Number.parseInt(minutesTexts[1])
  } else if (minutesText.includes(",") || Number.isFinite(Number(minutesText))) {
    state.minute.cronEvery = "3"
    state.minute.specificSpecific = minutesText.split(",").map(item => Number.parseInt(item))
  } else if (minutesText.includes("-")) {
    state.minute.cronEvery = "4"
    const minutesTexts = minutesText.split("-")
    state.minute.rangeStart = Number.parseInt(minutesTexts[0])
    state.minute.rangeEnd = Number.parseInt(minutesTexts[1])
  }
  // 解析 hours
  const hoursText = crons[2].trim()
  if (hoursText === "*") {
    state.hour.cronEvery = "1"
  } else if (hoursText.includes("/")) {
    state.hour.cronEvery = "2"
    const hoursTexts = hoursText.split("/")
    state.hour.incrementStart = Number.parseInt(hoursTexts[0])
    state.hour.incrementIncrement = Number.parseInt(hoursTexts[1])
  } else if (hoursText.includes(",") || Number.isFinite(Number(hoursText))) {
    state.hour.cronEvery = "3"
    state.hour.specificSpecific = hoursText.split(",").map(item => Number.parseInt(item))
  } else if (hoursText.includes("-")) {
    state.hour.cronEvery = "4"
    const hoursTexts = hoursText.split("-")
    state.hour.rangeStart = Number.parseInt(hoursTexts[0])
    state.hour.rangeEnd = Number.parseInt(hoursTexts[1])
  }
  // 解析 days
  const daysText = crons[3].trim()
  if (daysText.includes("/")) {
    state.day.cronEvery = "3"
    const daysTexts = daysText.split("/")
    state.day.incrementStart = Number.parseInt(daysTexts[0])
    state.day.incrementIncrement = Number.parseInt(daysTexts[1])
  } else if (daysText.includes(",") || Number.isFinite(Number(daysText))) {
    state.day.cronEvery = "5"
    state.day.specificSpecific = daysText.split(",").map(item => Number.parseInt(item))
  } else if (daysText.includes("-")) {
    state.day.cronEvery = "4"
    const daysTexts = daysText.split("-")
    state.day.rangeStart = Number.parseInt(daysTexts[0])
    state.day.rangeEnd = Number.parseInt(daysTexts[1])
  } else {
    state.day.cronEvery = "1"
  }

  // 解析 months
  const monthsText = crons[4].trim()
  if (monthsText === "*") {
    state.month.cronEvery = "1"
  } else if (monthsText.includes("/")) {
    state.month.cronEvery = "2"
    const monthsTexts = monthsText.split("/")
    state.month.incrementStart = Number.parseInt(monthsTexts[0])
    state.month.incrementIncrement = Number.parseInt(monthsTexts[1])
  } else if (monthsText.includes(",") || Number.isFinite(Number(monthsText))) {
    state.month.cronEvery = "3"
    state.month.specificSpecific = monthsText.split(",").map(item => Number.parseInt(item))
  } else if (monthsText.includes("-")) {
    state.month.cronEvery = "4"
    const monthsTexts = monthsText.split("-")
    state.month.rangeStart = Number.parseInt(monthsTexts[0])
    state.month.rangeEnd = Number.parseInt(monthsTexts[1])
  }
}, {
  immediate: true
})

function close(): void {
  emit("close")
}

function handleChange(): void {
  emit("change", state.cron)
  close()
}
</script>

<template>
  <div class="no-vue3-cron-div">
    <el-tabs type="border-card">
      <el-tab-pane>
        <template #label>
          <span><i class="el-icon-date" /> 秒</span>
        </template>
        <div class="tabBody myScroller" :style="{ 'max-height': maxHeight }">
          <el-row>
            <el-radio v-model="state.second.cronEvery" label="1">
              每一秒钟
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.second.cronEvery" label="2">
              每隔
              <el-input-number
                v-model="state.second.incrementIncrement"
                :min="1"
                :max="60"
              />
              秒执行 从
              <el-input-number

                v-model="state.second.incrementStart"
                :min="0"
                :max="59"
              />
              秒开始
            </el-radio>
          </el-row>
          <el-row>
            <el-radio class="long" v-model="state.second.cronEvery" label="3">
              具体秒数(可多选)
              <el-select

                multiple
                v-model="state.second.specificSpecific"
              >
                <el-option
                  v-for="(val, index) in 60"
                  :key="index"
                  :value="val - 1"
                >
                  {{ val - 1 }}
                </el-option>
              </el-select>
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.second.cronEvery" label="4">
              周期从
              <el-input-number

                v-model="state.second.rangeStart"
                :min="0"
                :max="59"
              />
              到
              <el-input-number

                v-model="state.second.rangeEnd"
                :min="0"
                :max="59"
              />
              秒
            </el-radio>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane>
        <template #label>
          <span><i class="el-icon-date" /> 分</span>
        </template>
        <div class="tabBody myScroller" :style="{ 'max-height': maxHeight }">
          <el-row>
            <el-radio v-model="state.minute.cronEvery" label="1">
              每一分钟
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.minute.cronEvery" label="2">
              每隔
              <el-input-number

                v-model="state.minute.incrementIncrement"
                :min="1"
                :max="60"
              />
              分执行 从
              <el-input-number

                v-model="state.minute.incrementStart"
                :min="0"
                :max="59"
              />
              分开始
            </el-radio>
          </el-row>
          <el-row>
            <el-radio class="long" v-model="state.minute.cronEvery" label="3">
              具体分钟数(可多选)
              <el-select

                multiple
                v-model="state.minute.specificSpecific"
              >
                <el-option
                  v-for="(val, index) in 60"
                  :key="index"
                  :value="val - 1"
                >
                  {{ val - 1 }}
                </el-option>
              </el-select>
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.minute.cronEvery" label="4">
              周期从
              <el-input-number

                v-model="state.minute.rangeStart"
                :min="0"
                :max="59"
              />
              到
              <el-input-number

                v-model="state.minute.rangeEnd"
                :min="0"
                :max="59"
              />
              分
            </el-radio>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane>
        <template #label>
          <span><i class="el-icon-date" /> 时</span>
        </template>
        <div class="tabBody myScroller" :style="{ 'max-height': maxHeight }">
          <el-row>
            <el-radio v-model="state.hour.cronEvery" label="1">
              每一小时
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.hour.cronEvery" label="2">
              每隔
              <el-input-number
                v-model="state.hour.incrementIncrement"
                :min="1"
                :max="23"
              />
              时执行 从
              <el-input-number

                v-model="state.hour.incrementStart"
                :min="0"
                :max="23"
              />
              时开始
            </el-radio>
          </el-row>
          <el-row>
            <el-radio class="long" v-model="state.hour.cronEvery" label="3">
              具体小时数(可多选)
              <el-select multiple v-model="state.hour.specificSpecific">
                <el-option
                  v-for="(val, index) in 24"
                  :key="index"
                  :value="val - 1"
                >
                  {{ val - 1 }}
                </el-option>
              </el-select>
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.hour.cronEvery" label="4">
              周期从
              <el-input-number

                v-model="state.hour.rangeStart"
                :min="0"
                :max="23"
              />
              到
              <el-input-number

                v-model="state.hour.rangeEnd"
                :min="0"
                :max="23"
              />
              小时
            </el-radio>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane>
        <template #label>
          <span><i class="el-icon-date" /> 天</span>
        </template>
        <div class="tabBody myScroller" :style="{ 'max-height': maxHeight }">
          <el-row>
            <el-radio v-model="state.day.cronEvery" label="1">
              每一天
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.day.cronEvery" label="3">
              每隔
              <el-input-number

                v-model="state.day.incrementIncrement"
                :min="1"
                :max="31"
              />
              天执行 从
              <el-input-number

                v-model="state.day.incrementStart"
                :min="1"
                :max="31"
              />
              日开始
            </el-radio>
          </el-row>

          <el-row>
            <el-radio class="long" v-model="state.day.cronEvery" label="5">
              具体天数(可多选)
              <el-select multiple v-model="state.day.specificSpecific">
                <el-option
                  v-for="(val, index) in 31"
                  :key="index"
                  :value="val"
                >
                  {{ val }}
                </el-option>
              </el-select>
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.day.cronEvery" label="4">
              周期从
              <el-input-number

                v-model="state.day.rangeStart"
                :min="1"
                :max="31"
              />
              到
              <el-input-number

                v-model="state.day.rangeEnd"
                :min="1"
                :max="31"
              />
              日
            </el-radio>
          </el-row>
        </div>
      </el-tab-pane>
      <el-tab-pane>
        <template #label>
          <span><i class="el-icon-date" /> 月</span>
        </template>
        <div class="tabBody myScroller" :style="{ 'max-height': maxHeight }">
          <el-row>
            <el-radio v-model="state.month.cronEvery" label="1">
              每一月
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.month.cronEvery" label="2">
              每隔
              <el-input-number

                v-model="state.month.incrementIncrement"
                :min="0"
                :max="12"
              />
              月执行 从
              <el-input-number

                v-model="state.month.incrementStart"
                :min="0"
                :max="12"
              />
              月开始
            </el-radio>
          </el-row>
          <el-row>
            <el-radio class="long" v-model="state.month.cronEvery" label="3">
              具体月数(可多选)
              <el-select multiple v-model="state.month.specificSpecific">
                <el-option
                  v-for="(val, index) in 12"
                  :key="index"
                  :label="val"
                  :value="val"
                />
              </el-select>
            </el-radio>
          </el-row>
          <el-row>
            <el-radio v-model="state.month.cronEvery" label="4">
              周期从
              <el-input-number

                v-model="state.month.rangeStart"
                :min="1"
                :max="12"
              />
              到
              <el-input-number

                v-model="state.month.rangeEnd"
                :min="1"
                :max="12"
              />
              月
            </el-radio>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
    <div class="bottom">
      <div class="value">
        <span>
          cron预览:
        </span>
        <el-tag type="primary">
          {{ state.cron }}
        </el-tag>
      </div>
      <div class="buttonDiv">
        <el-button type="primary" size="small" @click.stop="handleChange">
          保存
        </el-button>
        <el-button type="primary" size="small" @click="close">
          关闭
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.no-vue3-cron-div {
  .el-tabs {
    box-shadow: none;
  }

  .tabBody {
    overflow: auto;

    .el-row {
      margin: 20px 0;

      .long {
        .el-select {
          width: 200px;
        }
      }

      .el-input-number {
        width: 120px;
      }
    }
  }

  .myScroller {
    &::-webkit-scrollbar {
      /*滚动条整体样式*/
      width: 5px; /*高宽分别对应横竖滚动条的尺寸*/
      height: 1px;
    }

    &::-webkit-scrollbar-thumb {
      /*滚动条里面小方块*/
      border-radius: 10px;
      background-color: skyblue;
      background-image: -webkit-linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        transparent 75%,
        transparent
      );
    }

    &::-webkit-scrollbar-track {
      /*滚动条里面轨道*/
      box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
      background: #ededed;
      border-radius: 10px;
    }
  }

  .bottom {
    width: 100%;
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: space-around;

    .value {
      float: left;
      font-size: 14px;
      vertical-align: middle;

      span:nth-child(1) {
        color: red;
      }
    }
  }
}
</style>
