import { Component, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.scss'
})
export class PageNotFoundComponent implements OnInit {

  private location: Location = inject(Location);

  ngOnInit(): void {
    console.log("Locartion Data : ", Location)
  }

  back() {
    this.location.back();
  }

}
