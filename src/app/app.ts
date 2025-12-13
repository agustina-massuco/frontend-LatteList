import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from "./shared/footer/footer";
import { Header } from "./shared/header/header";
import { ToastComponent } from "./shared/toast/toast.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Header, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend-lattelist');
}
