import { Component, OnInit, ViewChild } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, BaseChartDirective, Label } from 'ng2-charts';
import * as pluginAnnotations from 'chartjs-plugin-annotation';


@Component({
  selector: 'app-exrt-distro-graph',
  templateUrl: './exrt-distro-graph.component.html',
  styleUrls: ['./exrt-distro-graph.component.scss']
})
export class ExrtDistroGraphComponent implements OnInit {
    
  public lineChartData: ChartDataSets[] = [
    { data: [1838, 1883, 1454, 1174, 1175, 1215], label: 'Holders' },
    { data: [9160, 5900, 6408, 8309, 6910, 5761], label: 'EXRT rate (per 10M regular EXRN)', yAxisID: 'y-axis-1' },
    { data: [35.8, 40.86, 38.3, 35.57, 40.1, 49], label: 'Total EXRN (in Billions)' }
  ];
  
  public lineChartLabels: Label[] = ['March 2018', 'June 2018', 'October 2018', 'January 2019', 'April 2019', 'July 2019'];
  
  public lineChartOptions: (ChartOptions & { annotation: any }) = {
    responsive: true,
    scales: {
      // We use this empty structure as a placeholder for dynamic theming.
      xAxes: [{}],
      yAxes: [
        {
          id: 'y-axis-0',
          position: 'left',
        },
        {
          id: 'y-axis-1',
          position: 'right',
          gridLines: {
            color: '#ccc',
          },
          ticks: {
            fontColor: '#253992',
          }
        }
      ]
    },
    annotation: {
      annotations: [
        {
          type: 'line',
          mode: 'vertical',
          scaleID: 'x-axis-0',
          value: 'March',
          borderColor: 'orange',
          borderWidth: 2,
          label: {
            enabled: true,
            fontColor: 'orange',
            content: 'LineAnno'
          }
        },
      ],
    },
  };
  
  public lineChartColors: Color[] = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // dark grey
      backgroundColor: 'rgba(37,57,146,0.2)',
      borderColor: 'rgba(37,57,146,1)',
      pointBackgroundColor: 'rgba(37,57,146,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(37,57,146,0.8)'
    },
    { // green
      backgroundColor: 'rgba(0,210,133,0.2)',
      borderColor: 'rgba(0,210,133,1',
      pointBackgroundColor: 'rgba(0,210,133,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(0,210,133,0.8)'
    }
  ];
  
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [pluginAnnotations];
  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;


  constructor() { }


  ngOnInit() {
  }
  

  // events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    //console.log(event, active);
  }


  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    //console.log(event, active);
  }
}