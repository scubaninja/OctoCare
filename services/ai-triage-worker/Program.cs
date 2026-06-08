using OctoCare.AiTriageWorker;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<TriageWorker>();
builder.Services.AddHttpClient();

var host = builder.Build();
host.Run();
