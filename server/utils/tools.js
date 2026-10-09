export const toolHandleMap = {
  help_dc: (arg) => {
    return {
      content: [
        {
          type: "text",
          text: `去往${arg.city}的车，订购成功`
        }
      ]
    }
  },
  // 前端卡片的方法，专门用来获取卡片的数据
  wm_card: () => {
    return [
      { name: "煲仔饭1", price: 10, id: "bz1" },
      { name: "煲仔饭2", price: 15, id: "bz2" },
      { name: "煲仔饭3", price: 20, id: "bz3" },
    ]
  },
  buy_wm: (arg) => {
    return {
      content: [
        {
          type: "text",
          text: `用户选择了${arg.id}的外卖，下单成功`
        }
      ]
    }
  }
}

export const frontList = ["wm_card"]

export const toolList = [
  {
    "type": "function",
    "function": {
      "name": "help_dp",
      "description": "当用户需要订票的时候调用此工具",
      // parameters 必须是 JSON Schema 格式,需 type/properties 包裹
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "用户订票的目的地"
          }
        },
        required: ["city"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "help_dc",
      "description": "当用户需要打车的时候调用此工具",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "用户打车的目的地"
          }
        },
        required: ["city"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "wm_card",
      "description": "当用户需要点外卖时，调用此工具可以让前端展示一个外卖选择ui组件",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            description: "用户点外卖的类型"
          }
        },
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "buy_wm",
      "description": "当用户决定了要点某个外卖的时候，调用此工具进行下单",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "要购买的外卖的id"
          }
        },
      }
    }
  }
]