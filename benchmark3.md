#

cnpm i
cnpm i autocannon -g
cnpm i pm2 -g

# 1. 127.0.0.1

## 1.测 fastify 空载

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/
> 60s
> 45215

// 无任何其它加载（自动注册，路由等）时。
> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/
> 60s
> 43788

## 2.单机 ECS 直连数据库

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/3/e4e497e849
> 17K

## 3.DB+REDIS

先访问一次 http://47.97.155.99:3000/api/3/e4e497e849 手工做好缓存

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/3/e4e497e849/10
> 34K

# 2.http://47.97.155.99:3000 (在 WINDOWS 本地测试)

## 1.测 fastify 空载

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:3000/
>  

## 2.单机 ECS 直连数据库

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:3000/api/3/e4e497e849
> 538
> 602

## 3.DB+REDIS

先访问一次 http://47.97.155.99:3000/api/3/e4e497e849 手工做好缓存

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:3000/api/3/e4e497e849/10
>  571

## 3.测写数据 (连接至 RDS 数据库，测试之前测表，记录成功写入数据量)

> truncate tbl_benchmark

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/173/a40772a615?type=fastify
> 本地：17755
> 60 秒 1065K 条数据
> 
> truncate tbl_benchmark
> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:3000/api/173/a40772a615?type=fastify
> 外网：561
> 60 秒：34k 条数据

关注点：内网测性能，即服务器每秒收到 N 个(10000 左右)并发的时候能及时处理，网络延时不受系统影响。

# 测 PHP(未测)

## 外网空载

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:9000/public/test.html
> 1808

## 内网空载

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:9000/public/test.html
> 7640

## 外网+redis

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:9000/api/3/e4e497e849/10
> 82

## 内网+redis

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:9000/api/3/e4e497e849/10
> 84

## 外网直连 db

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:9000/api/3/e4e497e849
> 79

## 内网直连 db

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:9000/api/3/e4e497e849
> 81

## 外网写入

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:9000/api/173/a40772a615?type=fastify
> 78
> 4834 rows in 60s

## 内网写入

> autocannon -c 100 -d 60 -o 10 http://47.97.155.99:9000/api/173/a40772a615?type=fastify
> 82
> 4914 rows in 60s
