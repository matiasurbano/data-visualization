var AutoViz = {
    init:function(config){
        this.resourceUrl = config.resourceUrl;
		this.fetchResource();
        
        
        this.data = null;
        this.cache();
        this.bindEvents();
        
        //first resource fetch
		return this;
        
    },
    cache:function(){
        this.map = $('#map');
        this.btnVizualizar = $('#visualizar');
        this.anio = $('#anio')
;       this.marca = $('#marca');
    },
    bindEvents:function(){
        _.bindAll(this,'prepareResults','renderResults');
        $('#visualizar').on('click',function(){
            AutoViz.btnVizualizar_click();
        });
    },
    btnVizualizar_click:function(){
        console.log('btnVizualizar_click');
        this.map.html('');
        this.fetchResource();
    },
    fetchResource:function(){
        var that =this;

        $.ajax({
          url: this.resourceUrl ,
          dataType: 'text',
        }).done(function( kml ) {
            log('KML template: COMPLETO');
            that.kmlTemplate = kml;
            loader(false);
            // Trigger Search
            that.search(that.anio.val(), that.marca.val());
        }).fail(
            function(e) {
                console.log('ERROR: Ajax Error');
        }).always(function(e) {
                console.log('COMPLETE: Ajax');
                loader(false);
        });
    },
    search:function(anio,marca){
        var that = this;
        log('RestOpenGov: consultando...');

        loader(true);

        if(!anio){
            var def = getDefaultValues();
            anio = def.anio;
            marca = def.marca;
        }

        consulta = {anio: anio ,marca:marca};
        $.getJSON('docs/json/automotores-'+ consulta.anio +'.json' , function(jsonData) {
            that.prepareResults(jsonData);
        });

    },
    prepareResults:function(resp){
        log('RestOpenGov: RESPUESTA');

        log('Procesando datos...');
        
        var prov,
        results = [],
        idProv,
        cant;

        $.each(resp,function(i,e){
            prov    = e['PROVINCIA'];
            idProv  = provincias[prov].id;
            cant    = (consulta.marca!='') ? e[consulta.marca] :  e['TOTAL'];
            if(idProv)
                results.push({id : idProv, cant : parseInt(cant), provincia : prov}); 
        });

        
        this.renderResults(results)
    },
    renderResults:function(data){
        log('Completando template...');
        var search,msg;
        kmlResuelto = this.kmlTemplate;

        var total=0;
        var cant =data.length;
        $.each(data,function(i,e){ total += parseInt(e.cant); });

        search = new RegExp('QUERY', 'gi');
        if(consulta.marca==''){
            msg = "Cantidad TOTAL en "+consulta.anio;
        } else {
            msg = "Cantidad " + consulta.marca + " en "+consulta.anio;
        }
        kmlResuelto = kmlResuelto.replace(search, msg);

        this.prepareVizBars(data);
        $.each(data, function(i, e) {
            var cantValue =  ((e.cant*100)/total) * 5000;

            search = new RegExp('{P_'+e.id+'_CANT}', 'gi');
            kmlResuelto = kmlResuelto.replace(search, cantValue +" autos");
            search = new RegExp('{P_'+e.id+'}', 'gi');
            kmlResuelto = kmlResuelto.replace(search,  cantValue);
        });

        // Google Api init
        visualize();
    },
    prepareVizBars: function(data){

    //Width and height
      var w = 840;
      var h = 150;
      var barPadding = 15;

      //Create SVG element
      var svg = d3.select(".bars")
            .append("svg")
            .attr("width", w)
            .attr("height", h);


      svg.selectAll("rect")
         .data(data)
         .enter()
         .append("rect")
         .attr("x", function(d, i) {
            return i * (w / data.length);
         })
         .attr("y", function(d) {
            return h - (d.cant / 200);
         })
         .attr("width", w / data.length - barPadding)
         .attr("height", function(d) {
            return d.cant / 200;
         })
         .attr("fill", function(d) {
          return '#' + provincias[d.provincia].color;
         })
        .attr("border", "1px solid");

      svg.selectAll("text")
         .data(data)
         .enter()
         .append("text")
         .text(function(d) {
            return d.provincia;
         })
         .attr("text-anchor", "middle")
         .attr("x", function(d, i) {
            return i * (w / data.length) + (w / data.length - barPadding) / 2;
         })
         .attr("y", function(d) {
            return h - ((d.cant / 200)) - 25;
         })
         .attr("font-size", "7px")
         .attr("fill", "black")
         .attr("font-weight", "bold")
         .attr("z-index", "2500");
    }
}
