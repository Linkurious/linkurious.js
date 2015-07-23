function logtitle(x) {
  document.title = x
  console.log(x)
}

function milli2nice(m) {
  var r =  Math.round(m*1000)/1000;
  return r+"ms"
}

function milli2nice2(m) {
  var r =  Math.round(m*1000)/1000;
  return r
}

function median(values) {
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if(values.length % 2){
        return values[half];
    }
    return (values[half-1] + values[half]) / 2.0;
}

function tocsv(results, name){
  var csvContent = "data:text/csv;charset=utf-8,";
  csvContent += results.join('\n');
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", name);
  link.click();
}

function bench(name, fn, options){
  options = options || {};
  samples = options.samples || 100;
  maxtime = options.maxtime || 5/samples; //seconds
  var start, total, times = [];
  var i = 0;
  for(;i < samples; i++){
    start = performance.now();
    fn()
    total = performance.now()-start;
    //console.log('cycle',i,milli2nice(total))
    times.push(total)

    if(total > options.maxtime*1000){
      break
    }
  }
  var sum = times.reduce(function(a, b) { return a + b; });
  var avg = sum / times.length;
  var med = median(times)
  var r = {
    avg:avg,
    min:Math.min.apply(null, times),
    max:Math.max.apply(null, times),
    times:times,
    median:med,
    sampled:i,
  }
  logtitle(name+'\n    median '+milli2nice(med)+'\n    max='+milli2nice(r.max)+' min='+milli2nice(r.min)+'\n    values: '+times.map(milli2nice).slice(0,10).join(', '))
  return r;
}

this.query_params = function(dict) {
    var query = window.location.search.substring(1).replace(/\/$/, "");
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        var rigth = decodeURIComponent(pair[1]);
        if (rigth == 'false'){
          rigth = false;
        }
        if(rigth == 'true'){
          rigth = true;
        }
        dict[decodeURIComponent(pair[0])] = rigth;
    }
}
var URL_PARAMS = {
    run: true,
};
this.query_params(URL_PARAMS);

all_defs = {}

//all_defs['sigma.canvas.edges.labels'] = edges_def;

all_defs['sigma.canvas.labels'] = nodes_def;

to_test = function(){
    s.refresh({skipIndexation:true})
}

if(URL_PARAMS.run){
  for(thing_dot_def in all_defs){
    console.group(thing_dot_def);
    var table = []
    var defs = all_defs[thing_dot_def];
    var thing = eval(thing_dot_def);
    defs.current = thing.def;
    defs.hidden = function(){};
    console.groupCollapsed('details')
    for(def in defs){
      thing.def = defs[def];
      var res = bench(thing_dot_def+' - '+def,to_test);
      table.push({'def':def,med:milli2nice2(res.median), min:milli2nice2(res.min)})
    }
    console.groupEnd()
    thing.def = defs.current;
    table = table.sort(function(x,y){return x.min-y.min})
    var min = table[0].min;
    table.forEach(function(x){
      x.diff = milli2nice2(x.min - min);
      x.min = milli2nice2(x.min);
      x.med = milli2nice2(x.med);
    })
    console.table(table);
    console.groupEnd();
  }
}