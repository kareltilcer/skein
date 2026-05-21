package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/kareldohnal/skein/internal/handler"
	"github.com/kareldohnal/skein/internal/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", handler.Health)

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: middleware.CORS(mux),
	}

	slog.Info("starting server", "port", port)
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
