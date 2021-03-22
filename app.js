require([
    "esri/config",
    "esri/Map",
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Home",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/widgets/ScaleBar",
    "esri/tasks/Geoprocessor",
    "esri/tasks/support/FeatureSet",
    "esri/widgets/Locate"
], function (
    esriConfig,
    Map,
    WebMap,
    MapView,
    Home,
    Graphic,
    GraphicsLayer,
    ScaleBar,
    Geoprocessor,
    FeatureSet,
    Locate
) {
    esriConfig.apiKey = "AAPK97868b6be78d4fa59e35e3389bfb6565hGSBK8bQlwHjTM32EiURSEJAnNeTE_S1yG57SD6GYQimdfho0YJP6xouq7fAkoCX";

    // Graphic Layers
    let depotLayer = new GraphicsLayer();
    const routeLayer = new GraphicsLayer();
    const deliveryLayer = new GraphicsLayer();
    const stopsLayer = new GraphicsLayer();

    //Featuresets
    let orders = new FeatureSet();
    let depots = new FeatureSet();

    let depotGraphic = new Graphic({
        attributes: { Name: "Aman HQ", TruckOrders: 100, TruckTime: 6000 },
        symbol: {
            type: "web-style",
            name: "bus-station",
            styleName: "Esri2DPointSymbolsStyle"
        },
        popupTemplate: {
            title: "Depot",
            content: `Trucks: {Trucks}<br>Deliveries: {Deliveries}`
        }
    })

    let stopSymbol = {
        type: "simple-marker",
        color: "red",
        size: "15px"
    }

    const map = new WebMap({
        portalItem: {
            id: "b4e6636ab5954913a45839ff3ac68b79"
        }
    });

    map.layers.add(stopsLayer);
    map.layers.add(routeLayer);
    map.layers.add(deliveryLayer);
    map.layers.add(depotLayer);

    // Create MapView(Zoom on Cairo)
    const view = new MapView({
        container: "viewDiv",
        map,
        center: [31.23, 30.06],
        scale: 45000,
        constraints: {
            snapToZoom: false
        }
    });

    view.ui.add(new ScaleBar({ view }), "bottom-right");

    //Create home Widget
    var homeWidget = new Home({
        view: view
    });
    // adds the home widget to the top left corner of the MapView
    view.ui.add(homeWidget, "top-left");

    var locateWidget = new Locate({
        view: view,   // Attaches the Locate button to the view
    });

    console.log(locateWidget);
    // view.ui.add(locateWidget, "top-left");

    editDepot = function () {
        document.getElementById("depot-name").value = depotGraphic.attributes.Name;
        document.getElementById('depot-div').style.display = "inline-block";

        document.getElementById('add-depot').onclick = () => {
            if (document.getElementById('use-location').checked) {
                //Get Current location
                locateWidget.locate().then((CurrentLocation) => {
                    depotGraphic.geometry = { type: "point", x: CurrentLocation.coords.longitude, y: CurrentLocation.coords.latitude }
                    depotLayer.graphics.removeAll();
                    depotLayer.add(depotGraphic);
                })
            }
            else {
                let depotHandler = view.on("click", (event) => {
                    depotGraphic.geometry = { type: "point", x: event.mapPoint.longitude, y: event.mapPoint.latitude }
                    depotLayer.graphics.removeAll();
                    depotLayer.add(depotGraphic);
                    depotHandler.remove();
                });
            }
            depotGraphic.attributes.Name = document.getElementById("depot-name").value;
            document.getElementById('depot-div').style.display = "none";
        }
    } // EditDepot

    window.chooseDepot = function () {
        document.getElementById("depot-name").value = depotGraphic.attributes.Name;
        document.getElementById('depot-div').style.display = "inline-block";

        document.getElementById('add-depot').onclick = () => {

            if (document.getElementById('use-location').checked) {
                //Get Current location
                locateWidget.locate().then((CurrentLocation) => {
                    console.log(CurrentLocation)
                    depotGraphic.geometry = { type: "point", x: CurrentLocation.coords.longitude, y: CurrentLocation.coords.latitude }
                    depotLayer.graphics.removeAll();
                    depotLayer.add(depotGraphic);
                })
            }
            else {
                let depotHandler = view.on("click", (event) => {
                    depotGraphic.geometry = { type: "point", x: event.mapPoint.longitude, y: event.mapPoint.latitude }
                    depotLayer.graphics.removeAll();
                    depotLayer.add(depotGraphic);
                    depotHandler.remove();
                });
            }
            document.getElementById('add-stops').style.display = "block"; //Show Add Stops button
            document.getElementById('depot-div').style.display = "none"; // Hide Depot div

            depotGraphic.attributes.Name = document.getElementById("depot-name").value; // Get depot name

            document.getElementById('choose-depot').innerText = "Edit Depot";
            document.getElementById('choose-depot').removeAttribute('onclick');
            $('#choose-depot').click(editDepot);
        }

    } // ChooseDepot  

    window.addStops = function () {
        let stopsHandler = view.on("click", (event) => {
            let stop = new Graphic({
                attributes: {},
                geometry: { type: "point", x: event.mapPoint.longitude, y: event.mapPoint.latitude },
                symbol: stopSymbol,
                popupTemplate: {
                    title: "Stop",
                    content: `Name: {Name}<br>Service Time: {ServiceTime}`
                }
            });
            stopsHandler.remove();
            document.getElementById("service-div").style.left = `${event.x}px`;
            document.getElementById("service-div").style.top = `${event.y}px`;
            document.getElementById("service-div").style.display = "inline-block";
            document.getElementById("add-service").onclick = () => {
                stop.attributes.Name = document.getElementById("stop-name").value;
                stop.attributes.ServiceTime = document.getElementById("stop-time").value;
                document.getElementById("service-div").style.display = "none";
                document.getElementById("stop-time").value = "10";
                document.getElementById('solve').style.display = "block";
                stopsLayer.add(stop);
                document.getElementById("stop-name").value = `Stop${stopsLayer.graphics.length + 1}`;
            }
        });
    } // addStops

    window.solve = async function () {
        $('#staticBackdrop').modal('show');

        orders.features = [];
        depots.features = [];

        stopsLayer.graphics.forEach(element => {    
            orders.features.push({
                attributes: { Name: element.attributes.Name, ServiceTime: element.attributes.ServiceTime },
                geometry: element.geometry
            })

        })

        depotLayer.graphics.forEach(element => {
            depots.features.push({
                attributes: { Name: element.attributes.Name },
                geometry: element.geometry
            });
        });

        const routes = new FeatureSet({
            features: [
                {
                    attributes: {
                        Name: "Route",
                        Description: "vehicle",
                        StartDepotName: depotLayer.graphics.items[0].attributes.Name,
                        EndDepotName: depotLayer.graphics.items[0].attributes.Name,
                        Capacities: "100",
                        MaxOrderCount: depotLayer.graphics.items[0].attributes.TruckOrders,
                        MaxTotalTime: depotLayer.graphics.items[0].attributes.TruckTime
                    }
                }
            ]
        });

        const params = {
            orders,                    // Feature Set
            depots,                    // Feature Set
            routes,                    // Feature Set
            populate_directions: true  // "Generate driving directions for the routes"
            , directionsLanguage: "ar",
            directionsLengthUnits: "kilometers",
            directions_style_name: "NA Navigation",
            save_route_data: true,
        };

        const geoprocessor = new Geoprocessor({
            url: "https://logistics.arcgis.com/arcgis/rest/services/World/VehicleRoutingProblemSync/GPServer/EditVehicleRoutingProblem",
            outSpatialReference: view.spatialReference
        });
        const { results } = await geoprocessor.execute(params);
        console.log(results);
        showStops(results[1].value.features);
        showRoutes(results[2].value.features);
        showDirections(results[3].value.features);
        addResultLink(results[6].value.url);
        $('#staticBackdrop').modal('hide');
    }

    function addResultLink(url) {
        let link = document.getElementById("result-link");
        if (!link) {
            link = document.createElement("a");
            link.id = "result-link";
            link.style.marginTop = "10px";
            link.classList.add("btn", "btn-sm", "btn-success");
            link.innerText = "Download Results";
            document.getElementById('buttons-div').appendChild(link);
        }
        link.href = url;
    }

    function showStops(stops) {
        for (const stop of stops) {
            const { SnapY, SnapX, RouteName, Sequence } = stop.attributes;
            stop.set({
                geometry: {
                    type: "point",
                    latitude: SnapY,
                    longitude: SnapX
                },
                symbol: {
                    type: "simple-marker",
                    color: '#ffc107',
                    outline: {
                        color: [0, 0, 0],
                        width: 1
                    },
                    size: "18px"
                },
                popupTemplate: {
                    title: "{Name}",
                    content: `${RouteName}<br>Stop: ${parseInt(Sequence) - 1}<br>Delivery Items: 1`
                }
            });
        }

        const labels = stops.map((stop) => stop.clone());
        for (const label of labels) {
            label.set({
                symbol: {
                    type: "text",
                    text: label.attributes.Sequence - 1,
                    font: { size: 11, weight: "bold" },
                    yoffset: -4,
                    color: [50, 50, 50]
                },
                popupTemplate: null
            });
        }

        deliveryLayer.addMany(stops);
        deliveryLayer.addMany(labels);
    }

    function showRoutes(routes) {
        for (const route of routes) {
            route.symbol = {
                type: "simple-line",
                color: [10, 171, 156, 1],
                width: "4px"
            }
        }
        routeLayer.addMany(routes);
    }

    function showDirections(directions, routeName) {

        function showRouteDirections(directions, truckName, fontColor) {
            const container = document.createElement("div");
            const directionsList = document.createElement("ol");
            directions.forEach(function (result, i) {
                const direction = document.createElement("li");
                direction.innerHTML = result.attributes.Text + ((result.attributes.DriveDistance > 0) ? " (" + result.attributes.DriveDistance.toFixed(2) + " Km)" : "");
                directionsList.appendChild(direction);
            });
            container.appendChild(directionsList);
            directionsElement.appendChild(container);
        }

        const directionsElement = document.createElement("div");
        directionsElement.innerHTML = "<h3>Directions</h3>";
        directionsElement.classList = "esri-widget esri-widget--panel esri-directions__scroller directions";
        directionsElement.style.marginTop = "0";
        directionsElement.style.padding = "0 15px";
        directionsElement.style.minHeight = "325px";

        const route1Directions = directions.filter((direction) => {
            return direction.attributes.RouteName === "Route";
        });
        showRouteDirections(route1Directions);

        view.ui.empty("top-right");
        view.ui.add(directionsElement, "top-right");
    }
});