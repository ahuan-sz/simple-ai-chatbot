// 打开本地postman软件，mac系统
import { exec } from 'child_process'
exec('open -a Postman', (err) => {
  if (err) {
    console.error('启动postman失败')
    return
  }
  console.log("Postman已打开")
})
