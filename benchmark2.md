#
cnpm i
cnpm i autocannon -g
cnpm i pm2 -g

# 1.  127.0.0.1

## 1.测fastify空载
> autocannon -c 100 -d 40 -o 10 http://127.0.0.1:3000/
40s     60s    90s
16014  18486  18741   

## 2.单机ECS直连数据库
> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/79/d2606592e4
3412(数据库端有网络延时)
3514

## 3.DB+REDIS
先访问一次 http://47.105.105.12:3000/api/79/d2606592e4 手工做好缓存

> autocannon -c 100 -d 60 -o 10 http://127.0.0.1:3000/api/79/d2606592e4/10
9200  9100

# 2.http://47.105.105.12:3000 (在WINDOWS本地测试)
## 1.测fastify空载
> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/
1032(外网网络延时)


## 2.单机ECS直连数据库
> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/api/79/d2606592e4
743
## 3.DB+REDIS
先访问一次 http://47.105.105.12:3000/api/79/d2606592e4 手工做好缓存

> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/api/79/d2606592e4/10
784

## 3.测写数据 (连接至RDS数据库，测试之前测表，记录成功写入数据量)
> truncate tbl_benchmark

> autocannon -c 100 -d 40 -o 10 http://127.0.0.1:3000/api/173/a40772a615?type=fastify
本地：1690
40秒 67730条数据
> truncate tbl_benchmark
> autocannon -c 100 -d 60 -o 10 http://47.105.105.12:3000/api/173/a40772a615?type=fastify
外网：869
60秒：52330条数据

关注点：内网测性能，即服务器每秒收到N个(10000左右)并发的时候能及时处理，网络延时不受系统影响。


# 测PHP(待做)

http://47.105.105.12:9000/public/test.html

http://127.0.0.1:9000/public/test.html

测读数据 缓存
http://47.105.105.12:9000/api/79/d2606592e4/10
http://127.0.0.1:9000/api/79/d2606592e4/10


测读数据 直连
http://47.105.105.12:9000/api/79/d2606592e4
http://127.0.0.1:9000/api/79/d2606592e4

测写数据
http://127.0.0.1:9000/api/173/a40772a615?type=fastify
http://47.105.105.12:9000/api/173/a40772a615?type=fastify
