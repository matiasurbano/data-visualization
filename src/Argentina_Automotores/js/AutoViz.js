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
        _.bindAll(AutoViz,'prepareResults','renderResults');
        this.btnVizualizar.on('click', this.btnVizualizar_click(this));
    },
    btnVizualizar_click:function(that){
        that.map.html('');
        // that.search(that.anio.val(), that.marca.val());
        this.fetchResource();
    },
    fetchResource:function(){
        var that =this;

        $.ajax({
          url: this.resourceUrl ,
          dataType: 'text',
        }).done(function( kml ) {
            log('KML template: COMPLETO__');
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
                results.push({id : idProv, cant : parseInt(cant)}); 
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
        
        $.each(data, function(i, e) { 
            var cantValue =  ((e.cant*100)/total) * 5000;
            
            search = new RegExp('{P_'+e.id+'_CANT}', 'gi');
            kmlResuelto = kmlResuelto.replace(search, cantValue +" autos");
            search = new RegExp('{P_'+e.id+'}', 'gi');
            kmlResuelto = kmlResuelto.replace(search,  cantValue);
        });

        // Google Api init
        visualize();
    }
    
}
