const cheerio = require('cheerio')
const { getWriter, getReader } = require('./utils')

async function main() {
  const reader = getReader('data/chapters.html')
  const chaptersHtml = await reader.read()
  const $ = cheerio.load(chaptersHtml)
  const allLinks = $('.list-body > ul > li')
  const links = Array.from(allLinks)
    .reverse()
    .map((link) => {
      const $link = $(link).find('a')
      const chapterName = $(link).find('span:first').text()
      return {
        name: chapterName,
        link: $link.attr('href'),
        number: extractChapterNumber(chapterName),
      }
    })

  const writer = getWriter('data/chapters.json')
  writer.write(JSON.stringify(links, null, 2))
}

function extractChapterNumber(chapterName) {
  console.log({ chapterName })
  const [number] = chapterName.match(/(\d+(\.\d+)?)$/)
  return parseFloat(number)
}

main()
