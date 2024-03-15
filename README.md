# 李兆基闪送小车项目
框架为 小车 <-> 服务器 <-> APP
服务器向小车发送目标点，获取小车状态信息
服务器 <-> APP： 用户交互

- 使用 MongoDB 作为数据库
    - 用户存储{用户名username，密码password，房间号room_id，ip}
    - 订单存储{订单号_id，下单时间time_start，结束时间time_end，
            起点房间room_start，终点房间room_end，
            柜门号door，下单者user_order，进行状态status
        - 队列中queueing
        - 待去起点run_to_get
        - 到达起点arrive_at_get
        - 成功装货success_get
        - 待去终点run_to_send
        - 到达终点arrive_at_send
        - 已完成finished
        - 异常状态：待返回returning, 失败failed, 被管理员处理fail_handled)，
            
            }

- 前端需要的功能
    - 下订单
    - 查看订单
    - 开门

- 管理员界面
    - pause，暂停
    - open，开门
    - handle，
    - recover，恢复
