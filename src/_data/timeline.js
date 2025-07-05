var axios = require("axios");
const fs = require("fs");
const wbk = require("wikidata-sdk");
const { DateTime } = require("luxon");

//https://www.wikidata.org/wiki/Wikidata:WikiProject_Video_games/Lists/Consoles

module.exports = async function () {
  const sparql = `SELECT ?item ?itemLabel ?pic ?gen ?genLabel ?manufacturer ?manufacturerLabel ?publicationdate
WHERE
{
  ?gen wdt:P31 wd:Q61697632. 
  ?item wdt:P361 ?gen.
  ?item wdt:P176 ?manufacturer.
  ?item wdt:P577 ?publicationdate.
  ?item wdt:P18 ?pic

SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
}
`;
  const url = wbk.sparqlQuery(sparql);
  var models = {};

  return axios
    .get(url)
    .then(function (response) {
      let data = wbk.simplify.sparqlResults(response.data);

      let events = data
        .filter((item) => {
          return "pic" in item && "manufacturer" in item && item.pic;
        })
        .filter(function (item) {
          if (models[item.item.label]) {
            return false;
          }
          models[item.item.label] = true;
          return true;
        })
        .map((item) => {
          let start = DateTime.fromISO(item.publicationdate);
          //console.log("start", start.toString())
          let event = {
            media: {
              url: item.pic,
              thumbnail:item.pic,
              /*caption:
              "Houston's mother and Gospel singer, Cissy Houston (left) and cousin Dionne Warwick.",
            credit:
              "Cissy Houston photo:<a href='http://www.flickr.com/photos/11447043@N00/418180903/'>Tom Marcello</a><br/><a href='http://commons.wikimedia.org/wiki/File%3ADionne_Warwick_television_special_1969.JPG'>Dionne Warwick: CBS Television via Wikimedia Commons</a>",
          */
            },
            start_date: {
              month: start.month,
              day: start.day,
              year: start.year,
            },
            text: {
              headline: item.item.label,
              text:
                "<p>" +
                item.manufacturer.label +
                "</p><p>" +
                item.gen.label +
                "</p>",
            },
          };
          return event;
        });

      let timeline = {
        title: {
          media: {
            url: "//www.flickr.com/photos/tm_10001/2310475988/",
            caption:
              "Whitney Houston performing on her My Love is Your Love Tour in Hamburg.",
            credit:
              "flickr/<a href='http://www.flickr.com/photos/tm_10001/'>tm_10001</a>",
          },
          text: {
            headline: "Games Consoles Timeline",
            text: "<p>Consoles through time</p>",
          },
        },
        events: events,
      };

      // convert JSON object to string
      const jdata = JSON.stringify(timeline);

      // write JSON string to a file
      fs.writeFile("./.data/timeline.json", jdata, (err) => {
        if (err) {
          throw err;
        }
        console.log("JSON data is saved.");
      });

      return Promise.resolve(timeline);
    })
    .catch(function (error) {
      console.log(error);
    });
};
