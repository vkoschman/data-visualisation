const width_second = window.innerWidth;
const height_second = window.innerHeight;
const sliderHeight = 100;
const colors = ['#d73027', '#1a9850']; // цвета градиента
const noColor = '#CDCCCC'; // для стран, по которым нет данных 
const duration = 700;// продолжительность анимации

loadData().then(({data, world}) => {
    // переменные состояния с начальными значениями
    let year = '1900';
    let param = 'gdp';

    // основной svg-элемент, содержащий карту          
    const svg = d3.select('body').append('svg')
    
    // TODO Part 1: тут можно создать линейную цветовую шкалу на основе цветов
    const color = d3.scaleLinear().range(colors);
    
    // массив с годами
    const years = Object.keys(data[0][param])
                        .map(d => +d)
                        .filter(d => d);

    // TODO Part 2: тут можно создать шкалы х и y
    // ...
    // const x = d3.scaleBand(years, [0, width_second]).padding(.1);
    // y = d3.scaleLinear().range([sliderHeight, 0]);
    
    // TODO Part 3: тут можно создать svg внутри #menu и добавить туда легенду
    // ...
    // const legend = d3.select('#menu').append('svg')
    //     .attr('width', 200).attr("height", 40)
    // let gradient = legend.append('defs')
    //     .append("svg:linearGradient")
    //         .attr("id", "gradient");

    // gradient.append('stop').attr('offset', '0%')
    //     .style("stop-color", colors[0]);
    // gradient.append('stop').attr('offset', '100%')
    //     .style("stop-color", colors[1]);

    // legend.append('rect')
    //     .attr('width', 200).attr("height", 20)
    //     .style("fill", "url(#gradient)");

    // const axis = legend.append('g').attr('id','axis').attr('transform', 'translate(0,20)');
     
    // вызываем update() при изменении param
     d3.selectAll('input[name="param"]').on('change',function(){
      param = this.value;
      update();
    });

    // создаем слайдер
    const slider = d3.sliderBottom()
        .domain([d3.min(years),d3.max(years)])
        .step(1).width(width_second).default(year)
        .ticks(0).displayValue(false)
        .on('onchange', val => { // вызываем update() при изменении year
            year = val;
            update();
        });

    // создаем svg для добавления своих элементов
    const range = d3.select('#slider').append('svg')
                    .attr('width', width_second).attr('height', sliderHeight);

    // накидываем overlay
    range.append('rect').attr('width', width_second).attr('height', height_second).attr('id', 'overlay');
    
    // создаем контейнер для барчарта
    const chart = range.append('g');

    // добавляем слайдер
    range.append('g').call(slider);
    
    // убираем лишние элементы и делаем кастюмный thumb
    d3.select('g.slider').selectAll('line').remove();
    // d3.select('g.parameter-value path').attr('d', `M 0,0 V ${sliderHeight} H -${x.bandwidth()} V 0 Z`);
    
    // TODO Part 1: тут можно создать проекцию d3.geoEquirectangular() и подстроить ее под размеры экрана, а также
    // создать генератор пути
    // TODO Part 1: тут можно добавить карту мира на основе генератора пути
    let map = svg.attr('id', 'map')
    var projection = d3.geoEquirectangular();
    var geoGenerator = d3.geoPath().projection(projection);
    const { height, width } = document.getElementById('map').getBoundingClientRect()
    projection.fitExtent([[ 0, 0 ], [width, height]], world)
    
    map = map.selectAll('path')
          .data(world.features)
          .enter()
          .append('path')
          .attr('d', geoGenerator);
    
    map.on('mouseover', overCountry)   //  TODO Part 1: добавить обработчики событий мыши для отображения имени страны в элементе #country
        .on('mouseout', outOfCountry);
        //   .attr('stroke', 'white');

    function overCountry(d){
        console.log(d.properties.name)
        d3.select('#country').text(d.properties.name);
    }

    function outOfCountry(){
        d3.select('#country').text(null);
    }

    // эта функция будет обновлять оба графика при изменении какого-либо из двух основных параметров
    function update(){
      // обновляем год
      d3.select('#year').text(year);

      // обновляем домен цветовой шкалы
      color.domain(d3.extent(data.map(d => +d[param][year])));
      let colorMap = d => +d[param][year];

      // изменяем цвета стран
      map.attr('fill', feature => {
            // находим страну в наборе данных
            let country = data.find(d => d.geo === feature.id.toLowerCase());
            // TODO Part 1: задать цвет страны в зависимости от выбранных параметров
            if (country == undefined) {
                return noColor;
            } else {
                return color(colorMap(country));
            };
        });

      // берем набор значений нужного показателя для каждого из годов для барчарта
      let array = years.map(y => d3.sum(data.map(d => +d[param][y])));
      // TODO Part 2: обновить домен шкалы y
      // ...

      // TODO Part 2: реализовать создание и добавление барчарта
      // ...

      
      // TODO Part 3: обновляем шкалу в легенде на основе выбранных параметров
      // ...
    }

  // вызываем update() при инициации
  update();
  });

  async function loadData() {
    const population = await d3.csv('data/pop.csv');
    const rest = { 
        'gdp': await d3.csv('data/gdppc.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expect.csv'),
        'fertility-rate': await d3.csv('data/tfr.csv')
    };
    const data = population.map(d=>{
        return {
            geo: d.geo,
            country: d.country,
            region: d.region,
            population: {...d},
            ...Object.values(rest).map(v=>v.find(r=>r.geo===d.geo)).reduce((o, d, i)=>({...o, [Object.keys(rest)[i]]: d }), {})
        }
    })
    const world = await d3.json('http://enjalot.github.io/wwsd/data/world/world-110m.geojson');
    console.log(data, world);
    return {data, world}
}