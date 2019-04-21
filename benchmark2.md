#

cnpm i
cnpm i autocannon -g
cnpm i pm2 -g

# 1. 127.0.0.1

## 1.测 fastify 空载

> autocannon -c 100 -d 40 -o 10 http://127.0.0.1:3000/
> 40s 60s 90s
> 16014 18486 18741

## 2.单机 ECS 直连数据库

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/79/d2606592e4
> 3412(数据库端有网络延时)
> 3514

## 3.DB+REDIS

先访问一次 http://47.105.105.12:3000/api/79/d2606592e4 手工做好缓存

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/79/d2606592e4/10
> 9200 9100

# 2.http://47.105.105.12:3000 (在 WINDOWS 本地测试)

## 1.测 fastify 空载

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/
> 1032(外网网络延时)

## 2.单机 ECS 直连数据库

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/api/79/d2606592e4
> 743

## 3.DB+REDIS

先访问一次 http://47.105.105.12:3000/api/79/d2606592e4 手工做好缓存

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/api/79/d2606592e4/10
> 784

## 3.测写数据 (连接至 RDS 数据库，测试之前测表，记录成功写入数据量)

> truncate tbl_benchmark

> autocannon -c 100 -d 40 -o 10 http://127.0.0.1:3000/api/173/a40772a615?type=fastify
> 本地：1690
> 40 秒 67730 条数据
> truncate tbl_benchmark
> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/api/173/a40772a615?type=fastify
> 外网：869
> 60 秒：52330 条数据

关注点：内网测性能，即服务器每秒收到 N 个(10000 左右)并发的时候能及时处理，网络延时不受系统影响。

# 测 PHP

## 外网空载

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:9000/public/test.html
> 1808

## 内网空载

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:9000/public/test.html
> 7640

## 外网+redis

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:9000/api/79/d2606592e4/10
> 82

## 内网+redis

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:9000/api/79/d2606592e4/10
> 84

## 外网直连 db

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:9000/api/79/d2606592e4
> 79

## 内网直连 db

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:9000/api/79/d2606592e4
> 81

## 外网写入

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:9000/api/173/a40772a615?type=fastify
> 78
> 4834 rows in 60s

## 内网写入

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:9000/api/173/a40772a615?type=fastify
> 82
> 4914 rows in 60s
