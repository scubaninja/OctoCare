using OctoCare.SlaWorker;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<SlaMonitorWorker>();

var host = builder.Build();
host.Run();
