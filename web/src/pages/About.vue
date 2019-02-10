<template>
  <v-content>
    <v-container>
      <v-layout justify-center>
        <v-flex xs12 lg8>
          <h1 class="teal--text">我哋幫你拆解難搞地址</h1>
          <p>
            為何要拆解地址？假設你在找尋
            <span class="amber lighten-4 red--text px-1">灣仔富德樓</span> 的位置，你會用Google地圖搜尋，然後得出地址全名、座標等資料。但如果你分析過千，甚至過萬個文字地址，又要顯示在地圖上，當中格式不統一、中英混雜，難道你要逐一搜尋？
          </p>

          <p>香港地址解析器（Hong Kong Address Parser）運用政府部門開放數據，比較輸入地址與搜尋結果的相似度，將香港文字地址拆解成地區、街道、門牌、大廈、座標、甚至區議會選區，方便港人分析地址資料，製作地圖。</p>

          <img class="title-image" src="result-card.png">

          <h2 class="teal--text">三大功能</h2>

          <v-layout row wrap>
            <v-flex xs12 md4>
              <v-card color="rgba(255, 255, 255, 0)" flat>
                <v-card-text>
                  <h3>中英翻譯地址</h3>
                  <p>香港人習慣雙語並用，有時你手上有一批中英夾雜的地址，香港地址解析器可以大量翻譯成中文，方便整理。</p>
                </v-card-text>
              </v-card>
            </v-flex>

            <v-flex xs12 md4>
              <v-card color="rgba(255, 255, 255, 0)" flat>
                <v-card-text>
                  <h3>地址轉座標</h3>
                  <p>如果你要將一批地址資料顯示在地圖上，首先要將地址轉換成座標，但Google Maps API開始向用家收費，而且你要先有編程底子才可方便使用香港地址解析器可以將大量中英文地址轉換成經緯度，方便製作互動地圖。</p>
                </v-card-text>
              </v-card>
            </v-flex>

            <v-flex xs12 md4>
              <v-card color="rgba(255, 255, 255, 0)" flat>
                <v-card-text>
                  <h3>統一地址格式</h3>
                  <p>香港地址解析器可以將大量不同格式的中英地址解析成地區、街道、門牌、大廈、區議會選區等地址資料，用家下載CSV格式檔案後，可進一步作樞紐分析空間數據，歸納地址集中在哪一地區、哪條街道，從凌亂資料中提煉找出有價值的資訊。</p>
                </v-card-text>
              </v-card>
            </v-flex>
          </v-layout>

          <h2 class="teal--text">我們是誰</h2>

          <p>如有查詢、功能建議，歡迎到<a
                class="teal--text text--darken-2"
                href="https://goo.gl/forms/r6bdJHG228IZTgIZ2"
                target="_blank"
              >此</a>留言。</p>

          <h2 class="teal--text">採用開放數據</h2>
          <ul>
            <li>
              <a
                class="teal--text text--darken-2 ml-3 px-1"
                href="https://data.gov.hk/tc-data/dataset/hk-ogcio-st_div_02-als"
                target="_blank"
              >地址搜尋服務</a>
              <span class="grey--text ml-3 px-1">政府資訊科技總監辦公室</span>
            </li>
            <li>
              <a
                class="teal--text text--darken-2 ml-3 px-1"
                href="https://geodata.gov.hk/gs/locationSearchAPI?l=zh-Hant-HK"
                target="_blank"
              >地理位置搜尋應用程式介面</a>
              <span class="grey--text ml-3 px-1">地政總署</span>
            </li>
          </ul>
        </v-flex>
      </v-layout>
    </v-container>
  </v-content>
</template>

<style scoped>

a {
  text-decoration: none;
}
.title-image {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}


</style>
