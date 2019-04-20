# 1.thinkPHP

## 直连
> autocannon -c 100 -d 40 -o 10 http://api.cbpc.ltd/79/d2606592e4.json

RPS = 100

## 本地文件缓存
> autocannon -c 100 -d 40 -o 10 http://api.cbpc.ltd/79/d2606592e4/10

RPS = 120

# 2.fastify
## 2.1 不装docker
直接在linux中跑，安装  nodejs后
> npm install -g cnpm --registry=https://registry.npm.taobao.org

> cnpm i pm2 -g

> npm start

## 2.2 装docker
运行在容器中

## 2.3 测框架性能
> autocannon -c 100 -d 40 -o 10 http://api.cbpc.ltd:3000/

> 直接输出 {"foo":"bar"} ，此时fastify部署了路由，自动载入，mysql连接，redis连接等模块。性能较fastify直接输出低。

## 2.4 测读数据

### 2.4.1 单机ECS直连数据库
> autocannon -c 100 -d 40 -o 10 http://api.cbpc.ltd:3000/79/d2606592e4


### 2.4.1 单机ECS连数据库，redis缓存
实际不走数据库，通过Redis抗压

> autocannon -c 100 -d 40 -o 10 http://api.cbpc.ltd:3000/79/d2606592e4/10

