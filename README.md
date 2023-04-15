# inter-node-replication

## Overview

`MQTT` 技術を使って、複数サーバー間でリアルタイムに更新データを同期するサンプル


## How to run app

- Node.js & npm インストール

- ソースコード取得
  - `$ git clone https://github.com/dotnsf/inter-node-replication`
  
- ライブラリインストール
  - `$ cd inter-node-replication`
  - `$ npm install`

- アプリ１を実行
  - `$ PORT=8081 node app`

- アプリ２を実行
  - `$ PORT=8082 node app`


## How to demonstrate

- アプリ実行後に２つのブラウザで以下にそれぞれアクセス
  - アプリ１
    - `http://localhost:8081/_doc`

  - アプリ２
    - `http://localhost:8082/_doc`

- アプリ１、アプリ２ともに同じデータが表示( `GET /items` )されている

- どちらかのアプリで `POST /item` で新規データを追加すると、もう片方のアプリにも追加される


## Environment values

- `MQTT_URL` : URL for MQTT broker(default: ``)

- `MQTT_PORT` : Port for MQTT broker(default: `1880`)

- `MQTT_TOPIC` : Topic string of MQTT(default: ``)


## Licensing

This code is licensed under MIT.


## Copyright

2023 K.Kimura @ Juge.Me all rights reserved.

