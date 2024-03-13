# 李兆基闪送小车项目
框架为 小车 <-> 服务器 <-> APP
服务器向小车发送目标点，获取小车状态信息
服务器 <-> APP： 用户交互

- 使用 MongoDB 作为数据库
    - 用户存储{用户名username，密码password，房间号room_id，ip}
    - 订单存储{订单号_id，下单时间time_start，结束时间time_end，
            起点房间room_start，终点房间room_end，
            柜门号door，取件码code，进行状态status
            (待去起点pending，待去终点running，已完成finished，
             待返回returning, 失败failed, 被管理员处理fail_handled)，
            下单者user_order
            }