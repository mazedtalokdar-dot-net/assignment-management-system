using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Assignment__Submisstion_Manegment_System_API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private static readonly string LogFilePath = Path.Combine(AppContext.BaseDirectory, "logs", "app-log.txt");
        private static readonly object LogLock = new object();

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
            
            // Ensure logs directory exists
            var directory = Path.GetDirectoryName(LogFilePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
        }

        private static void WriteLogToFile(string message)
        {
            lock (LogLock)
            {
                try
                {
                    File.AppendAllText(LogFilePath, message);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Logging System Error] Failed to write to {LogFilePath}: {ex.Message}");
                }
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Write a simple request log to the file
                var requestLog = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] REQUEST: {context.Request.Method} {context.Request.Path}{Environment.NewLine}";
                WriteLogToFile(requestLog);

                await _next(context);

                // Write a simple response log to the file
                var responseLog = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] RESPONSE: {context.Response.StatusCode} for {context.Request.Method} {context.Request.Path}{Environment.NewLine}";
                WriteLogToFile(responseLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred.");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var errorLog = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] ERROR: {exception.Message}{Environment.NewLine}Stack Trace: {exception.StackTrace}{Environment.NewLine}";
            WriteLogToFile(errorLog);

            var response = new
            {
                type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                title = "An unexpected error occurred while processing your request.",
                status = context.Response.StatusCode,
                detail = exception.Message,
                instance = context.Request.Path
            };

            var json = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(json);
        }
    }
}
