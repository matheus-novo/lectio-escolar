namespace LectioEscolar.Api.Services
{
    public class LocalStorageService : IFileStorageService
    {
        private readonly string _baseStoragePath;

        public LocalStorageService(IConfiguration configuration)
        {
            var configuredPath = Environment.GetEnvironmentVariable("STORAGE_UPLOAD_PATH") 
                                 ?? configuration["Storage:UploadPath"] 
                                 ?? "Storage/Uploads";

            // Se for relativo, ancora na raiz da aplicação
            _baseStoragePath = Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(Directory.GetCurrentDirectory(), configuredPath);

            if (!Directory.Exists(_baseStoragePath))
            {
                Directory.CreateDirectory(_baseStoragePath);
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, string subFolder = "")
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("O arquivo informado é inválido ou está vazio.");

            var targetDirectory = string.IsNullOrWhiteSpace(subFolder)
                ? _baseStoragePath
                : Path.Combine(_baseStoragePath, subFolder);

            if (!Directory.Exists(targetDirectory))
            {
                Directory.CreateDirectory(targetDirectory);
            }

            // Gera nome físico único via GUID preservando a extensão original
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uniqueFileName = $"{Guid.NewGuid():N}{fileExtension}";
            var fullPath = Path.Combine(targetDirectory, uniqueFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return uniqueFileName;
        }

        public Task DeleteFileAsync(string fileName, string subFolder = "")
        {
            var filePath = GetPhysicalPath(fileName, subFolder);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            return Task.CompletedTask;
        }

        public string GetPhysicalPath(string fileName, string subFolder = "")
        {
            // Sanitização simples para mitigar Directory Traversal
            var safeFileName = Path.GetFileName(fileName);

            return string.IsNullOrWhiteSpace(subFolder)
                ? Path.Combine(_baseStoragePath, safeFileName)
                : Path.Combine(_baseStoragePath, subFolder, safeFileName);
        }

        public bool FileExists(string fileName, string subFolder = "")
        {
            return File.Exists(GetPhysicalPath(fileName, subFolder));
        }
    }
}